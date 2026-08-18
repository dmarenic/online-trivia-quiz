import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from './prisma/prisma.service';
import type { JwtPayload } from './auth/auth.types';
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from './config/validation.constants';

// Maksimalan broj igrača po sobi. Šalje se klijentu unutar toPublicRoom da
// sučelje ne bi ponavljalo istu vrijednost kao vlastiti literal.
const MAX_PLAYERS_PER_ROOM = 8;

// Koliko pozivnica u sobu ostaje važeća. Ista vrijednost vrijedi i za REST
// verziju (users.controller.ts) — soba živi u memoriji, pa starija pozivnica
// najčešće vodi u sobu koje više nema.
const ROOM_INVITE_TTL_MS = 30000;

type Player = {
  id: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  answeredQuestions: number[];
  userId?: string;
  isReady: boolean;
  connected: boolean;
};

type Room = {
  code: string;
  hostId: string;
  hostUserId?: string;
  players: Player[];
  currentQuestionIndex: number;
  started: boolean;
  acceptingAnswers: boolean;
  selectedCategory: string;
  questionStartTime: number;
  questions: QuizQuestion[];
  questionCount: number;
  timePerQuestion: number;
  selectedDifficulty: string;
  resultsSaved: boolean;
};

type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type SocketUser = {
  id: string;
  email?: string;
  role?: string;
};

function shuffleArray<T>(array: T[]) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function toPublicQuestion(question: QuizQuestion) {
  return {
    id: question.id,
    category: question.category,
    question: question.question,
    options: question.options,
  };
}

// Javna verzija sobe za slanje klijentima — NIKAD ne slati interni Room
// objekt jer questions[] sadrži correctAnswer.
function toPublicRoom(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    hostUserId: room.hostUserId,
    players: room.players,
    currentQuestionIndex: room.currentQuestionIndex,
    started: room.started,
    acceptingAnswers: room.acceptingAnswers,
    selectedCategory: room.selectedCategory,
    selectedDifficulty: room.selectedDifficulty,
    questionCount: room.questionCount,
    timePerQuestion: room.timePerQuestion,
    maxPlayers: MAX_PLAYERS_PER_ROOM,
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class GameGateway implements OnGatewayDisconnect {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);

  private rooms: Map<string, Room> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  // Grace-tajmer za auto-advance kad host ne prijeđe na sljedeće pitanje.
  private advanceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly messageTimestamps = new Map<string, number[]>();

  private isValidRoomCode(roomCode: unknown): roomCode is string {
    return (
      typeof roomCode === 'string' &&
      roomCode.trim().length >= 3 &&
      roomCode.trim().length <= 20
    );
  }

  // Isti raspon kao za registrirano korisničko ime, da se prikazano ime igrača
  // ponaša jednako bez obzira igra li gost ili prijavljeni korisnik.
  private isValidNickname(nickname: unknown): nickname is string {
    return (
      typeof nickname === 'string' &&
      nickname.trim().length >= USERNAME_MIN_LENGTH &&
      nickname.trim().length <= USERNAME_MAX_LENGTH
    );
  }

  private isValidChatMessage(message: unknown): message is string {
    return (
      typeof message === 'string' &&
      message.trim().length >= 1 &&
      message.trim().length <= 300
    );
  }

  private isValidCategory(category: unknown): category is string {
    return (
      typeof category === 'string' &&
      category.trim().length >= 1 &&
      category.trim().length <= 50
    );
  }

  // Dozvoljene težine: 'All' je sentinel za "bez filtra" u
  // getQuestionsForSettings, ostale vrijednosti moraju odgovarati bazi.
  private static readonly ALLOWED_DIFFICULTIES = [
    'All',
    'easy',
    'medium',
    'hard',
  ];

  private isValidDifficulty(difficulty: unknown): difficulty is string {
    return (
      typeof difficulty === 'string' &&
      GameGateway.ALLOWED_DIFFICULTIES.includes(difficulty.trim())
    );
  }

  private isValidAnswer(answer: unknown): answer is string {
    return (
      typeof answer === 'string' &&
      answer.trim().length >= 1 &&
      answer.trim().length <= 300
    );
  }

  private normalizeRoomCode(roomCode: string) {
    return roomCode.trim().toUpperCase();
  }

  // Alfabet bez 0/O i 1/I da se kod lakše prepisuje bez zabune.
  private static readonly ROOM_CODE_ALPHABET =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  private static readonly ROOM_CODE_LENGTH = 6;

  // Gornja granica broja istovremenih soba (zaštita od memory-flooda).
  private static readonly MAX_ROOMS = 500;

  private generateRoomCode(): string {
    const alphabet = GameGateway.ROOM_CODE_ALPHABET;
    let code: string;

    do {
      code = Array.from(
        { length: GameGateway.ROOM_CODE_LENGTH },
        () => alphabet[randomInt(alphabet.length)],
      ).join('');
    } while (this.rooms.has(code));

    return code;
  }

  private sanitizeText(value: string) {
    return value.trim();
  }

  // Postavke sobe dolaze od klijenta pa se ne smiju vjerovati. Pravilo je
  // namjerno asimetrično: besmislen ili premali unos vraća se na zadanu
  // vrijednost, dok se prevelik samo obrezuje na gornju granicu — tako
  // slučajna tipfeler-vrijednost ne pokvari partiju, a namjerno napuhan broj
  // ne može opteretiti server.
  private getSafeQuestionCount(value: unknown, fallback = 10) {
    const count = Number(value);

    if (!Number.isInteger(count)) return fallback;
    if (count < 1) return fallback;
    if (count > 50) return 50;

    return count;
  }

  private getSafeTimePerQuestion(value: unknown, fallback = 15) {
    const time = Number(value);

    if (!Number.isInteger(time)) return fallback;
    if (time < 5) return fallback;
    if (time > 120) return 120;

    return time;
  }

  // Rate-limit tipa "sliding window": po ključu se pamte vremena zadnjih
  // akcija, stara se odbacuju, a akcija se odbija ako ih u zadnjih windowMs
  // ima već `limit`. Ključ nije samo socket.id nego socket.id + namjena
  // (npr. `create_`, `join_`, `invite_`) da svaka radnja ima vlastitu kvotu.
  private isRateLimited(socketId: string, limit = 10, windowMs = 10000) {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(socketId) ?? [];

    const recent = timestamps.filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= limit) {
      this.messageTimestamps.set(socketId, recent);
      return true;
    }

    recent.push(now);
    this.messageTimestamps.set(socketId, recent);

    return false;
  }

  private getUserFromSocket(client: Socket): SocketUser | null {
    // Socket autentikacija je opcionalna: bez tokena korisnik igra kao gost.
    // Token stiže u handshakeu, pa ga treba provjeriti ručno — HTTP guardovi
    // se na WebSocket vezu ne primjenjuju.
    const token: unknown = client.handshake.auth?.token;

    if (typeof token !== 'string' || !token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  private isRoomHost(room: Room, client: Socket): boolean {
    const authUser = this.getUserFromSocket(client);

    if (room.hostUserId && authUser?.id === room.hostUserId) {
      return true;
    }

    return room.hostId === client.id;
  }

  // Grace period nakon disconnecta hosta: refresh taba traje par sekundi,
  // pa host ulogu predajemo drugom igraču tek ako se host ne vrati.
  private static readonly HOST_RECONNECT_GRACE_MS = 10000;

  private scheduleHostReassignment(roomCode: string) {
    setTimeout(() => {
      const room = this.rooms.get(roomCode);

      if (!room) return;

      const currentHost = room.players.find((p) => p.id === room.hostId);

      if (currentHost && currentHost.connected !== false) return;

      const newHost = room.players.find((p) => p.connected !== false);

      if (!newHost) return;

      room.hostId = newHost.id;
      room.hostUserId = newHost.userId;
      newHost.isReady = true;

      this.server.to(roomCode).emit('room_updated', toPublicRoom(room));
    }, GameGateway.HOST_RECONNECT_GRACE_MS);
  }

  // Bodovanje: fiksnih 1000 bodova za točan odgovor + bonus na brzinu.
  // Bonus pada linearno ~1 bod po 30 ms (500 bodova nakon 15 s padne na 0),
  // pa brži igrač uz jednak broj točnih odgovora završi ispred sporijeg.
  // Netočan odgovor nikad ne umanjuje rezultat (nema negativnih bodova).
  private calculatePoints(isCorrect: boolean, responseTimeMs: number) {
    if (!isCorrect) return 0;

    const basePoints = 1000;
    const speedBonus = Math.max(0, 500 - Math.floor(responseTimeMs / 30));

    return basePoints + speedBonus;
  }

  private getAnsweredCount(room: Room) {
    return room.players.filter((player) =>
      player.answeredQuestions.includes(room.currentQuestionIndex),
    ).length;
  }

  private haveAllPlayersAnswered(room: Room) {
    return this.getAnsweredCount(room) === room.players.length;
  }

  // Ako host ne prijeđe na sljedeće pitanje unutar ovog perioda nakon što
  // pitanje završi, partija se automatski nastavlja — inače bi AFK (prisutan
  // ali neaktivan) host zaglavio igru za sve ostale.
  private static readonly HOST_ADVANCE_GRACE_MS = 30000;

  private clearAdvanceTimer(roomCode: string) {
    const timer = this.advanceTimers.get(roomCode);

    if (timer) {
      clearTimeout(timer);
      this.advanceTimers.delete(roomCode);
    }
  }

  private endQuestion(room: Room) {
    const oldTimer = this.timers.get(room.code);

    if (oldTimer) {
      clearInterval(oldTimer);
      this.timers.delete(room.code);
    }

    room.acceptingAnswers = false;

    this.server.to(room.code).emit('question_ended', {
      players: room.players,
      answeredCount: this.getAnsweredCount(room),
      totalPlayers: room.players.length,
    });

    // Auto-advance ako host ne prijeđe unutar grace perioda.
    this.clearAdvanceTimer(room.code);

    const graceTimer = setTimeout(() => {
      this.advanceTimers.delete(room.code);

      const latest = this.rooms.get(room.code);

      // Preskoči ako je soba nestala, host je već prešao (nova runda ima
      // acceptingAnswers === true) ili je igra u međuvremenu gotova.
      if (!latest || !latest.started || latest.acceptingAnswers) return;

      this.advanceQuestion(latest);
    }, GameGateway.HOST_ADVANCE_GRACE_MS);

    this.advanceTimers.set(room.code, graceTimer);
  }

  private startQuestionTimer(room: Room) {
    const oldTimer = this.timers.get(room.code);

    if (oldTimer) {
      clearInterval(oldTimer);
      this.timers.delete(room.code);
    }

    let timeLeft = room.timePerQuestion;

    // questionStartTime je referentna točka za izračun brzine odgovora
    // (calculatePoints) i za rekonstrukciju preostalog vremena kod reconnecta.
    room.acceptingAnswers = true;
    room.questionStartTime = Date.now();

    this.server.to(room.code).emit('timer_updated', timeLeft);

    const timer = setInterval(() => {
      timeLeft--;

      this.server.to(room.code).emit('timer_updated', timeLeft);

      if (timeLeft <= 0) {
        this.endQuestion(room);
      }
    }, 1000);

    this.timers.set(room.code, timer);
  }

  // Dohvat fonda pitanja za postavke sobe. Vrijednost 'All' je sentinel koji
  // znači "bez filtra" pa se odgovarajući uvjet uopće ne dodaje u `where`.
  // Ponuđeni odgovori se promiješaju već pri dohvatu, tako da točan odgovor
  // nije uvijek na istoj poziciji (A–D) — redoslijed je isti za sve igrače
  // jer je pitanje dio stanja sobe, a ne stanja pojedinog klijenta.
  private async getQuestionsForSettings(category: string, difficulty: string) {
    const where: Prisma.QuestionWhereInput = {};

    if (category !== 'All') {
      where.category = category;
    }

    if (difficulty !== 'All') {
      where.difficulty = difficulty;
    }

    const dbQuestions = await this.prisma.question.findMany({
      where,
    });

    return dbQuestions.map((question) => ({
      id: question.id,
      category: question.category,
      question: question.question,
      options: shuffleArray([
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ]),
      correctAnswer: question.correctAnswer,
    }));
  }
  private async saveGameResults(room: Room) {
    // Idempotentno: partija se sprema samo jednom, bez obzira zove li se iz
    // normalnog kraja (next_question) ili iz cleanupa napuštene sobe.
    if (room.resultsSaved) return;
    room.resultsSaved = true;

    for (const player of room.players) {
      if (!player.userId) continue;

      await this.prisma.gameResult.create({
        data: {
          nickname: player.nickname,
          score: player.score,
          correctAnswers: player.correctAnswers,
          totalQuestions: room.questions.length,
          mode: 'multiplayer',
          userId: player.userId,
        },
      });
    }
  }

  @SubscribeMessage('join_user_channel')
  joinUserChannel(@ConnectedSocket() client: Socket) {
    const authUser = this.getUserFromSocket(client);

    if (!authUser) {
      client.emit('error_message', 'Nisi prijavljen.');
      return;
    }

    void client.join(`user_${authUser.id}`);
  }

  @SubscribeMessage('send_room_invite')
  async sendRoomInvite(
    @MessageBody()
    data: {
      toUserId: string;
      roomCode: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const authUser = this.getUserFromSocket(client);
    if (this.isRateLimited(`invite_${client.id}`, 5, 60000)) {
      client.emit(
        'error_message',
        'Previše pozivnica. Pričekaj minutu prije novog slanja.',
      );
      return;
    }

    if (!authUser) {
      client.emit('error_message', 'Nisi prijavljen.');
      return;
    }

    if (
      !data ||
      typeof data.toUserId !== 'string' ||
      data.toUserId.trim().length < 1 ||
      data.toUserId.length > 100 ||
      !this.isValidRoomCode(data.roomCode)
    ) {
      client.emit('error_message', 'Neispravni podaci za pozivnicu.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const room = this.rooms.get(roomCode);

    if (!room) {
      client.emit('error_message', 'Soba nije pronađena.');
      return;
    }

    const senderInRoom = room.players.some(
      (player) => player.userId === authUser.id || player.id === client.id,
    );

    if (!senderInRoom) {
      client.emit('error_message', 'Nisi član ove sobe.');
      return;
    }

    const friendship = await this.prisma.friend.findFirst({
      where: {
        status: 'accepted',
        OR: [
          {
            senderId: authUser.id,
            receiverId: data.toUserId,
          },
          {
            senderId: data.toUserId,
            receiverId: authUser.id,
          },
        ],
      },
    });

    if (!friendship) {
      client.emit('error_message', 'Pozivnicu možeš poslati samo prijatelju.');
      return;
    }

    await this.prisma.roomInvite.deleteMany({
      where: {
        OR: [
          {
            toUserId: data.toUserId,
            roomCode,
          },
          {
            createdAt: {
              lt: new Date(Date.now() - ROOM_INVITE_TTL_MS),
            },
          },
        ],
      },
    });

    const invite = await this.prisma.roomInvite.create({
      data: {
        fromUserId: authUser.id,
        toUserId: data.toUserId,
        roomCode,
      },
      include: {
        fromUser: {
          select: {
            username: true,
          },
        },
      },
    });

    this.server
      .to(`user_${data.toUserId}`)
      .emit('room_invite_received', invite);

    // Pozivnica se sama gasi nakon isteka; async posao je izdvojen u metodu
    // jer setTimeout ne čeka vraćeni Promise (pa greška ne bi imala hvatača).
    setTimeout(() => {
      void this.expireRoomInvite(invite.id, data.toUserId);
    }, ROOM_INVITE_TTL_MS);

    return invite;
  }

  private async expireRoomInvite(inviteId: string, toUserId: string) {
    try {
      await this.prisma.roomInvite.deleteMany({
        where: {
          id: inviteId,
        },
      });

      this.server.to(`user_${toUserId}`).emit('room_invite_expired', {
        inviteId,
      });
    } catch (error) {
      this.logger.error('Brisanje istekle pozivnice nije uspjelo', error);
    }
  }

  @SubscribeMessage('create_room')
  createRoom(
    @MessageBody()
    data: {
      nickname: string;
      questionCount?: number;
      timePerQuestion?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !this.isValidNickname(data.nickname)) {
      client.emit('error_message', 'Neispravan nadimak.');
      return;
    }

    if (this.isRateLimited(`create_${client.id}`, 5, 60000)) {
      client.emit('error_message', 'Prebrzo kreiraš sobe. Pričekaj minutu.');
      return;
    }

    if (this.rooms.size >= GameGateway.MAX_ROOMS) {
      client.emit(
        'error_message',
        'Server je trenutačno pun. Pokušaj kasnije.',
      );
      return;
    }

    const authUser = this.getUserFromSocket(client);
    const userId = authUser?.id;

    const roomCode = this.generateRoomCode();

    const questionCount = this.getSafeQuestionCount(data.questionCount, 10);
    const timePerQuestion = this.getSafeTimePerQuestion(
      data.timePerQuestion,
      15,
    );

    const player: Player = {
      id: client.id,
      nickname: this.sanitizeText(data.nickname),
      score: 0,
      correctAnswers: 0,
      answeredQuestions: [],
      userId,
      isReady: true,
      connected: true,
    };

    const room: Room = {
      code: roomCode,
      hostId: client.id,
      hostUserId: userId,
      players: [player],
      currentQuestionIndex: 0,
      started: false,
      acceptingAnswers: false,
      selectedCategory: 'All',
      selectedDifficulty: 'All',
      questionStartTime: 0,
      questions: [],
      questionCount,
      timePerQuestion,
      resultsSaved: false,
    };

    this.rooms.set(roomCode, room);
    void client.join(roomCode);

    client.emit('room_created', toPublicRoom(room));
  }

  @SubscribeMessage('join_room')
  joinRoom(
    @MessageBody()
    data: {
      roomCode: string;
      nickname: string;
      reconnect?: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data ||
      !this.isValidRoomCode(data.roomCode) ||
      !this.isValidNickname(data.nickname)
    ) {
      client.emit('error_message', 'Neispravan kod sobe ili nadimak.');
      return;
    }

    if (this.isRateLimited(`join_${client.id}`, 20, 60000)) {
      client.emit(
        'error_message',
        'Prebrzo se pokušavaš pridružiti. Pričekaj.',
      );
      return;
    }

    const authUser = this.getUserFromSocket(client);
    const userId = authUser?.id;
    const roomCode = this.normalizeRoomCode(data.roomCode);
    const nickname = this.sanitizeText(data.nickname);

    const room = this.rooms.get(roomCode);

    if (!room) {
      client.emit('error_message', 'Soba nije pronađena.');
      return;
    }

    const reconnectingPlayer = room.players.find((player) => {
      if (userId && player.userId) {
        return player.userId === userId;
      }

      // Gost (bez userId): match po nadimku SAMO ako je taj slot odspojen,
      // inače bi drugi gost s istim nadimkom preuzeo tuđi aktivni slot.
      return player.nickname === nickname && player.connected === false;
    });

    if (reconnectingPlayer) {
      // hostId nosi stari socket id — provjeri prije nego što ga pregazimo,
      // inače se guest-host (bez userId) nakon refresha ne prepozna kao host
      const wasHost = room.hostId === reconnectingPlayer.id;

      reconnectingPlayer.id = client.id;
      reconnectingPlayer.connected = true;
      void client.join(room.code);

      if (
        wasHost ||
        (room.hostUserId && userId && room.hostUserId === userId)
      ) {
        room.hostId = client.id;
        reconnectingPlayer.isReady = true;
      }

      if (room.started) {
        const elapsedSeconds = Math.floor(
          (Date.now() - room.questionStartTime) / 1000,
        );

        const timeLeft = Math.max(0, room.timePerQuestion - elapsedSeconds);

        client.emit('reconnected_to_game', {
          room: toPublicRoom(room),
          question: room.questions[room.currentQuestionIndex]
            ? toPublicQuestion(room.questions[room.currentQuestionIndex])
            : null,
          questionNumber: room.currentQuestionIndex + 1,
          totalQuestions: room.questions.length,
          answeredCount: this.getAnsweredCount(room),
          totalPlayers: room.players.length,
          timeLeft,
          acceptingAnswers: room.acceptingAnswers,
          hasAnswered: reconnectingPlayer.answeredQuestions.includes(
            room.currentQuestionIndex,
          ),
        });
      } else {
        client.emit('room_updated', toPublicRoom(room));
      }

      this.server.to(room.code).emit('room_updated', toPublicRoom(room));
      return;
    }

    if (room.started) {
      client.emit('error_message', 'Igra je već počela.');
      return;
    }

    const existingPlayer = room.players.find(
      (player) => player.id === client.id,
    );

    if (existingPlayer) {
      client.emit('room_updated', toPublicRoom(room));
      return;
    }

    // Novi igrač ne smije preuzeti nadimak koji već drži spojeni igrač.
    const nicknameTaken = room.players.some(
      (player) => player.nickname === nickname && player.connected !== false,
    );

    if (nicknameTaken) {
      client.emit('error_message', 'Nadimak je već zauzet u ovoj sobi.');
      return;
    }

    // Kapacitet se provjerava tek ovdje, nakon reconnect grane: igrač koji se
    // vraća u punu sobu ne smije biti odbijen jer već zauzima svoje mjesto.
    if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
      client.emit('error_message', 'Soba je puna.');
      return;
    }

    const player: Player = {
      id: client.id,
      nickname,
      score: 0,
      correctAnswers: 0,
      answeredQuestions: [],
      userId,
      isReady: false,
      connected: true,
    };

    room.players.push(player);
    void client.join(room.code);

    this.server.to(room.code).emit('player_joined', toPublicRoom(room));
    this.server.to(room.code).emit('room_updated', toPublicRoom(room));
  }
  @SubscribeMessage('kick_player')
  kickPlayer(
    @MessageBody()
    data: {
      roomCode: string;
      playerId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !this.isValidRoomCode(data.roomCode)) {
      client.emit('error_message', 'Neispravan kod sobe.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const room = this.rooms.get(roomCode);

    if (!room) {
      client.emit('error_message', 'Soba nije pronađena.');
      return;
    }

    if (!this.isRoomHost(room, client)) {
      client.emit('error_message', 'Samo host može izbacivati igrače.');
      return;
    }

    if (data.playerId === room.hostId) {
      client.emit('error_message', 'Ne možeš izbaciti hosta.');
      return;
    }

    const kickedPlayer = room.players.find(
      (player) => player.id === data.playerId,
    );

    if (!kickedPlayer) {
      client.emit('error_message', 'Igrač nije pronađen.');
      return;
    }

    room.players = room.players.filter((player) => player.id !== data.playerId);

    this.server.to(data.playerId).emit('kicked_from_room');

    // Uklanjanje iz room.players nije dovoljno - socket ostaje u Socket.IO
    // sobi i nastavlja primati broadcastove (chat, pitanja), pa ga treba
    // izbaciti i s transportne razine.
    this.server.in(data.playerId).socketsLeave(room.code);

    if (this.disposeRoomIfEmpty(roomCode)) return;

    this.server.to(room.code).emit('room_updated', toPublicRoom(room));
  }

  // Zajednički cleanup za oba mjesta koja igrača trajno uklanjaju iz sobe
  // (leave_room i kick_player). Kad soba ostane prazna, odgođeni cleanup iz
  // handleDisconnecta se više neće pokrenuti jer taj igrač nije ni u jednoj
  // sobi — bez ovoga bi prazna soba i njezini tajmeri ostali u memoriji do
  // restarta procesa. Vraća true ako je soba obrisana.
  private disposeRoomIfEmpty(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);

    if (!room || room.players.length > 0) {
      return false;
    }

    if (room.started && !room.resultsSaved) {
      this.saveGameResults(room).catch((error) => {
        this.logger.error('Greška kod spremanja rezultata', error);
      });
    }

    const timer = this.timers.get(roomCode);

    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomCode);
    }

    this.clearAdvanceTimer(roomCode);
    this.rooms.delete(roomCode);

    return true;
  }

  // Eksplicitan izlazak iz sobe (gumb "Napusti sobu"). Za razliku od
  // handleDisconnecta, koji igrača samo označi kao odspojenog jer refresh i
  // kratki prekid veze nisu namjera da se izađe, ovdje se igrač uklanja odmah —
  // inače bi zauvijek ostao u popisu kao "Offline", ulazio u totalPlayers i
  // blokirao haveAllPlayersAnswered.
  @SubscribeMessage('leave_room')
  leaveRoom(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !this.isValidRoomCode(data.roomCode)) {
      client.emit('error_message', 'Neispravan kod sobe.');
      return;
    }

    // Blaži limit nego kod ulaska: normalan izlazak je jedan event po sobi,
    // pa ovo zaustavlja samo automatizirano ponavljanje.
    if (this.isRateLimited(`leave_${client.id}`, 10, 60000)) {
      client.emit('error_message', 'Prebrzo napuštaš sobe. Pričekaj.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    const player = room.players.find((p) => p.id === client.id);

    if (!player) return;

    const wasHost = room.hostId === client.id;

    room.players = room.players.filter((p) => p.id !== client.id);
    void client.leave(room.code);

    if (this.disposeRoomIfEmpty(roomCode)) return;

    // Host je otišao namjerno, pa se uloga predaje odmah — grace period iz
    // scheduleHostReassignment postoji samo zbog mogućeg povratka nakon refresha.
    if (wasHost) {
      const newHost = room.players.find((p) => p.connected !== false);

      if (newHost) {
        room.hostId = newHost.id;
        room.hostUserId = newHost.userId;
        newHost.isReady = true;
      }
    }

    this.server.to(room.code).emit('room_updated', toPublicRoom(room));

    // Ako je otišao zadnji igrač od kojeg se čekao odgovor, runda može
    // završiti odmah umjesto da ostali čekaju istek tajmera.
    if (
      room.started &&
      room.acceptingAnswers &&
      this.haveAllPlayersAnswered(room)
    ) {
      this.endQuestion(room);
    }
  }
  @SubscribeMessage('set_category')
  setCategory(
    @MessageBody() data: { roomCode: string; category: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data ||
      !this.isValidRoomCode(data.roomCode) ||
      !this.isValidCategory(data.category)
    ) {
      client.emit('error_message', 'Neispravni podaci za kategoriju.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const category = this.sanitizeText(data.category);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    if (!this.isRoomHost(room, client)) {
      client.emit('error_message', 'Samo host može mijenjati kategoriju.');
      return;
    }

    if (room.started) {
      client.emit(
        'error_message',
        'Kategorija se ne može mijenjati tijekom igre.',
      );
      return;
    }

    room.selectedCategory = category;

    this.server.to(room.code).emit('category_updated', {
      category,
    });

    this.server.to(room.code).emit('room_updated', toPublicRoom(room));
  }

  @SubscribeMessage('toggle_ready')
  toggleReady(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !this.isValidRoomCode(data.roomCode)) {
      client.emit('error_message', 'Neispravan kod sobe.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    const player = room.players.find((p) => p.id === client.id);

    if (!player) return;

    if (this.isRoomHost(room, client)) {
      player.isReady = true;
    } else {
      player.isReady = !player.isReady;
    }

    this.server.to(room.code).emit('room_updated', toPublicRoom(room));
  }

  @SubscribeMessage('start_game')
  async startGame(
    @MessageBody()
    data: {
      roomCode: string;
      questionCount?: number;
      timePerQuestion?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !this.isValidRoomCode(data.roomCode)) {
      client.emit('error_message', 'Neispravan kod sobe.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    if (!this.isRoomHost(room, client)) {
      client.emit('error_message', 'Samo host može pokrenuti igru.');
      return;
    }

    const allReady = room.players.every((player) => {
      const isHost =
        player.id === room.hostId ||
        (!!room.hostUserId && player.userId === room.hostUserId);

      return isHost || player.isReady;
    });

    if (!allReady) {
      client.emit('error_message', 'Svi igrači moraju biti ready.');
      return;
    }

    const questionCount = this.getSafeQuestionCount(
      data.questionCount,
      room.questionCount || 10,
    );

    const timePerQuestion = this.getSafeTimePerQuestion(
      data.timePerQuestion,
      room.timePerQuestion || 15,
    );

    room.questionCount = questionCount;
    room.timePerQuestion = timePerQuestion;

    const allQuestions = await this.getQuestionsForSettings(
      room.selectedCategory,
      room.selectedDifficulty,
    );

    const selectedQuestions = shuffleArray(allQuestions).slice(
      0,
      questionCount,
    );

    if (selectedQuestions.length === 0) {
      client.emit('error_message', 'Nema pitanja za odabranu kategoriju.');
      return;
    }

    room.questions = selectedQuestions;
    room.currentQuestionIndex = 0;
    room.started = true;
    room.acceptingAnswers = true;

    room.players = room.players.map((player) => ({
      ...player,
      score: 0,
      correctAnswers: 0,
      answeredQuestions: [],
      isReady:
        player.id === room.hostId ||
        (!!room.hostUserId && player.userId === room.hostUserId)
          ? true
          : player.isReady,
    }));

    const firstQuestion = room.questions[0];

    this.server.to(room.code).emit('game_started', {
      question: toPublicQuestion(firstQuestion),
      questionNumber: 1,
      totalQuestions: room.questions.length,
      answeredCount: 0,
      totalPlayers: room.players.length,
      timePerQuestion: room.timePerQuestion,
    });

    this.startQuestionTimer(room);
  }

  @SubscribeMessage('set_difficulty')
  setDifficulty(
    @MessageBody() data: { roomCode: string; difficulty: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data ||
      !this.isValidRoomCode(data.roomCode) ||
      !this.isValidDifficulty(data.difficulty)
    ) {
      client.emit('error_message', 'Neispravni podaci za težinu.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const difficulty = this.sanitizeText(data.difficulty);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    if (!this.isRoomHost(room, client)) {
      client.emit('error_message', 'Samo host može mijenjati težinu.');
      return;
    }

    if (room.started) {
      client.emit('error_message', 'Težina se ne može mijenjati tijekom igre.');
      return;
    }

    room.selectedDifficulty = difficulty;

    this.server.to(room.code).emit('room_updated', toPublicRoom(room));
  }

  @SubscribeMessage('update_settings')
  updateSettings(
    @MessageBody()
    data: {
      roomCode: string;
      questionCount?: number;
      timePerQuestion?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !this.isValidRoomCode(data.roomCode)) {
      client.emit('error_message', 'Neispravni podaci za postavke.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    if (!this.isRoomHost(room, client)) {
      client.emit('error_message', 'Samo host može mijenjati postavke.');
      return;
    }

    if (room.started) {
      client.emit(
        'error_message',
        'Postavke se ne mogu mijenjati tijekom igre.',
      );
      return;
    }

    room.questionCount = this.getSafeQuestionCount(
      data.questionCount,
      room.questionCount || 10,
    );

    room.timePerQuestion = this.getSafeTimePerQuestion(
      data.timePerQuestion,
      room.timePerQuestion || 15,
    );

    this.server.to(room.code).emit('room_updated', toPublicRoom(room));
  }

  @SubscribeMessage('submit_answer')
  submitAnswer(
    @MessageBody() data: { roomCode: string; answer: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data ||
      !this.isValidRoomCode(data.roomCode) ||
      !this.isValidAnswer(data.answer)
    ) {
      client.emit('error_message', 'Neispravan odgovor.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const answer = this.sanitizeText(data.answer);
    const room = this.rooms.get(roomCode);

    if (!room || !room.started || !room.acceptingAnswers) return;

    const player = room.players.find((p) => p.id === client.id);

    if (!player) return;

    if (player.answeredQuestions.includes(room.currentQuestionIndex)) return;

    const question = room.questions[room.currentQuestionIndex];

    if (!question) return;

    // Indeks pitanja se bilježi PRIJE bodovanja: to je oznaka "ovaj igrač je
    // odgovorio na ovo pitanje" na kojoj počiva zaštita od dvostrukog
    // odgovaranja (provjera iznad) i brojanje odgovorenih igrača.
    player.answeredQuestions.push(room.currentQuestionIndex);

    // Server je autoritet za točnost i bodove — klijent šalje samo tekst
    // odabranog odgovora, nikad rezultat. Zato correctAnswer nikad ne izlazi
    // iz servera prije nego što igrač odgovori (v. toPublicQuestion).
    const responseTimeMs = Date.now() - room.questionStartTime;
    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      player.correctAnswers++;
    }

    const pointsEarned = this.calculatePoints(isCorrect, responseTimeMs);

    player.score += pointsEarned;

    client.emit('answer_result', {
      isCorrect,
      correctAnswer: question.correctAnswer,
      pointsEarned,
      players: room.players,
      answeredCount: this.getAnsweredCount(room),
      totalPlayers: room.players.length,
    });

    this.server.to(room.code).emit('answer_status_updated', {
      answeredCount: this.getAnsweredCount(room),
      totalPlayers: room.players.length,
    });

    if (this.haveAllPlayersAnswered(room)) {
      this.endQuestion(room);
    }
  }

  @SubscribeMessage('next_question')
  nextQuestion(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !this.isValidRoomCode(data.roomCode)) {
      client.emit('error_message', 'Neispravan kod sobe.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    if (!this.isRoomHost(room, client)) {
      client.emit('error_message', 'Samo host može prebaciti pitanje.');
      return;
    }

    if (room.acceptingAnswers) {
      client.emit(
        'error_message',
        `Ne možeš pokrenuti sljedeće pitanje dok svi nisu odgovorili ili vrijeme nije isteklo. (${this.getAnsweredCount(room)}/${room.players.length})`,
      );
      return;
    }

    this.advanceQuestion(room);
  }

  // Prelazak na sljedeće pitanje ili kraj igre. Zove se ručno (host preko
  // next_question) i automatski (grace auto-advance iz endQuestion).
  private advanceQuestion(room: Room) {
    this.clearAdvanceTimer(room.code);

    const nextIndex = room.currentQuestionIndex + 1;

    if (nextIndex >= room.questions.length) {
      const oldTimer = this.timers.get(room.code);

      if (oldTimer) {
        clearInterval(oldTimer);
        this.timers.delete(room.code);
      }

      room.started = false;
      room.acceptingAnswers = false;

      room.players = room.players.map((player) => ({
        ...player,
        isReady:
          player.id === room.hostId ||
          (!!room.hostUserId && player.userId === room.hostUserId),
      }));

      this.server.to(room.code).emit('game_finished', {
        players: room.players,
        room: toPublicRoom(room),
      });

      this.server.to(room.code).emit('room_updated', toPublicRoom(room));

      this.saveGameResults(room).catch((error) => {
        this.logger.error('Greška kod spremanja rezultata', error);
      });

      return;
    }

    room.currentQuestionIndex = nextIndex;
    room.acceptingAnswers = true;

    const nextQuestion = room.questions[room.currentQuestionIndex];

    this.server.to(room.code).emit('question_started', {
      question: toPublicQuestion(nextQuestion),
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.questions.length,
      answeredCount: 0,
      totalPlayers: room.players.length,
      timePerQuestion: room.timePerQuestion,
    });

    this.startQuestionTimer(room);
  }

  @SubscribeMessage('send_message')
  sendMessage(
    @MessageBody()
    data: {
      roomCode: string;
      nickname: string;
      message: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (
      !data ||
      !this.isValidRoomCode(data.roomCode) ||
      !this.isValidChatMessage(data.message)
    ) {
      return;
    }

    if (this.isRateLimited(client.id)) {
      client.emit('error_message', 'Šalješ poruke prebrzo.');
      return;
    }

    const roomCode = this.normalizeRoomCode(data.roomCode);
    const message = this.sanitizeText(data.message);
    const room = this.rooms.get(roomCode);

    if (!room) return;

    const player = room.players.find((p) => p.id === client.id);

    if (!player) return;

    this.server.to(room.code).emit('new_message', {
      nickname: player.nickname,
      message,
      createdAt: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.messageTimestamps.delete(client.id);
    this.messageTimestamps.delete(`invite_${client.id}`);
    this.messageTimestamps.delete(`create_${client.id}`);
    this.messageTimestamps.delete(`join_${client.id}`);
    this.messageTimestamps.delete(`leave_${client.id}`);

    for (const [roomCode, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.id === client.id);

      if (!player) continue;

      player.connected = false;

      if (room.hostId === client.id) {
        this.scheduleHostReassignment(roomCode);
      }

      this.server.to(roomCode).emit('room_updated', toPublicRoom(room));

      setTimeout(() => {
        const latestRoom = this.rooms.get(roomCode);

        if (!latestRoom) return;

        const hasConnectedPlayers = latestRoom.players.some(
          (p) => p.connected !== false,
        );

        if (hasConnectedPlayers) return;

        // Svi su otišli: ako je partija bila u tijeku, spremi rezultate prije
        // brisanja sobe (inače se odigrana partija gubi). Idempotentni guard u
        // saveGameResults sprječava dvostruko spremanje ako je već završila.
        if (latestRoom.started && !latestRoom.resultsSaved) {
          this.saveGameResults(latestRoom).catch((error) => {
            this.logger.error('Greška kod spremanja rezultata', error);
          });
        }

        const timer = this.timers.get(roomCode);

        if (timer) {
          clearInterval(timer);
          this.timers.delete(roomCode);
        }

        this.clearAdvanceTimer(roomCode);
        this.rooms.delete(roomCode);
      }, 30000);
    }
  }
}
