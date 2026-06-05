import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';

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

type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
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
};

type SocketUser = {
  id: string;
  email?: string;
  role?: string;
};

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

function toPublicQuestion(question: QuizQuestion) {
  return {
    id: question.id,
    category: question.category,
    question: question.question,
    options: question.options,
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

  private rooms: Map<string, Room> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private readonly messageTimestamps = new Map<string, number[]>();

  private isValidRoomCode(roomCode: unknown): roomCode is string {
    return (
      typeof roomCode === 'string' &&
      roomCode.trim().length >= 3 &&
      roomCode.trim().length <= 20
    );
  }

  private isValidNickname(nickname: unknown): nickname is string {
    return (
      typeof nickname === 'string' &&
      nickname.trim().length >= 1 &&
      nickname.trim().length <= 30
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

  private sanitizeText(value: string) {
    return value.trim();
  }

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
    const token = client.handshake.auth?.token;

    if (!token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify(token);

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
  }

  private startQuestionTimer(room: Room) {
    const oldTimer = this.timers.get(room.code);

    if (oldTimer) {
      clearInterval(oldTimer);
      this.timers.delete(room.code);
    }

    let timeLeft = room.timePerQuestion;

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

  private async getQuestionsForCategory(category: string) {
    const dbQuestions = await this.prisma.question.findMany({
      where:
        category === 'All'
          ? {}
          : {
              category,
            },
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

  private async unlockAchievement(
    userId: string,
    title: string,
    description: string,
  ) {
    const existing = await this.prisma.achievement.findFirst({
      where: {
        userId,
        title,
      },
    });

    if (existing) return;

    await this.prisma.achievement.create({
      data: {
        userId,
        title,
        description,
      },
    });
  }

  private async checkAchievements(
    userId: string,
    score: number,
    correctAnswers: number,
    totalQuestions: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        results: true,
      },
    });

    if (!user) return;

    const gamesPlayed = user.results.length;
    const accuracy =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    if (gamesPlayed >= 1) {
      await this.unlockAchievement(
        userId,
        'First Game',
        'Odigraj svoju prvu igru.',
      );
    }

    if (gamesPlayed >= 5) {
      await this.unlockAchievement(userId, 'Quiz Rookie', 'Odigraj 5 igara.');
    }

    if (gamesPlayed >= 10) {
      await this.unlockAchievement(
        userId,
        '10 Games Played',
        'Odigraj 10 igara.',
      );
    }

    if (gamesPlayed >= 25) {
      await this.unlockAchievement(
        userId,
        'Quiz Veteran',
        'Odigraj 25 igara.',
      );
    }

    if (score >= 15000) {
      await this.unlockAchievement(
        userId,
        'High Scorer',
        'Osvoji 15000+ bodova u jednoj igri.',
      );
    }

    if (score >= 25000) {
      await this.unlockAchievement(
        userId,
        'Quiz Master',
        'Osvoji 25000+ bodova u jednoj igri.',
      );
    }

    if (accuracy >= 80 && totalQuestions > 0) {
      await this.unlockAchievement(
        userId,
        'Sharp Shooter',
        'Ostvari barem 80% točnosti u jednoj igri.',
      );
    }

    if (accuracy === 100 && totalQuestions > 0) {
      await this.unlockAchievement(
        userId,
        'Perfect Game',
        'Odgovori točno na sva pitanja u jednoj igri.',
      );
    }

    if (user.level >= 5) {
      await this.unlockAchievement(userId, 'Level 5', 'Dosegni level 5.');
    }

    if (user.level >= 10) {
      await this.unlockAchievement(userId, 'Level 10', 'Dosegni level 10.');
    }
  }

  private async saveGameResults(room: Room) {
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

      const xpEarned = Math.floor(player.score / 100);

      const user = await this.prisma.user.findUnique({
        where: {
          id: player.userId,
        },
      });

      if (user) {
        const newXp = user.xp + xpEarned;
        const newLevel = Math.floor(newXp / 1000) + 1;

        await this.prisma.user.update({
          where: {
            id: player.userId,
          },
          data: {
            xp: newXp,
            level: newLevel,
          },
        });
      }

      await this.checkAchievements(
        player.userId,
        player.score,
        player.correctAnswers,
        room.questions.length,
      );
    }
  }

  @SubscribeMessage('join_user_channel')
  joinUserChannel(@ConnectedSocket() client: Socket) {
    const authUser = this.getUserFromSocket(client);

    if (!authUser) {
      client.emit('error_message', 'Nisi prijavljen.');
      return;
    }

    client.join(`user_${authUser.id}`);
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

    this.server.to(`user_${data.toUserId}`).emit('room_invite_received', invite);

    return invite;
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

    const authUser = this.getUserFromSocket(client);
    const userId = authUser?.id;

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

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
      questionStartTime: 0,
      questions: [],
      questionCount,
      timePerQuestion,
    };

    this.rooms.set(roomCode, room);
    client.join(roomCode);

    client.emit('room_created', room);
  }

  @SubscribeMessage('join_room')
  joinRoom(
    @MessageBody()
    data: {
      roomCode: string;
      nickname: string;
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

    const authUser = this.getUserFromSocket(client);
    const userId = authUser?.id;
    const roomCode = this.normalizeRoomCode(data.roomCode);
    const nickname = this.sanitizeText(data.nickname);

    const room = this.rooms.get(roomCode);

    if (!room) {
      client.emit('error_message', 'Soba nije pronađena.');
      return;
    }

    if (room.started) {
      client.emit('error_message', 'Igra je već počela.');
      return;
    }

    const reconnectingPlayer = room.players.find((player) => {
      if (userId && player.userId) {
        return player.userId === userId;
      }

      return player.nickname === nickname;
    });

    if (reconnectingPlayer) {
      reconnectingPlayer.id = client.id;
      reconnectingPlayer.connected = true;
      client.join(room.code);

      if (room.hostUserId && userId && room.hostUserId === userId) {
        room.hostId = client.id;
        reconnectingPlayer.isReady = true;
      }

      client.emit('room_updated', room);
      this.server.to(room.code).emit('room_updated', room);
      return;
    }

    const existingPlayer = room.players.find(
      (player) => player.id === client.id,
    );

    if (existingPlayer) {
      client.emit('room_updated', room);
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
    client.join(room.code);

    this.server.to(room.code).emit('player_joined', room);
    this.server.to(room.code).emit('room_updated', room);
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

    this.server.to(room.code).emit('room_updated', room);
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

    this.server.to(room.code).emit('room_updated', room);
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

    const allQuestions = await this.getQuestionsForCategory(
      room.selectedCategory,
    );

    const selectedQuestions = shuffleArray(allQuestions).slice(0, questionCount);

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

    player.answeredQuestions.push(room.currentQuestionIndex);

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
        room,
      });

      this.server.to(room.code).emit('room_updated', room);

      this.saveGameResults(room).catch((error) => {
        console.error('Greška kod spremanja rezultata:', error);
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

    for (const [roomCode, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.id === client.id);

      if (!player) continue;

      player.connected = false;

      this.server.to(roomCode).emit('room_updated', room);

      setTimeout(() => {
        const latestRoom = this.rooms.get(roomCode);

        if (!latestRoom) return;

        const hasConnectedPlayers = latestRoom.players.some(
          (p) => p.connected !== false,
        );

        if (hasConnectedPlayers) return;

        const timer = this.timers.get(roomCode);

        if (timer) {
          clearInterval(timer);
          this.timers.delete(roomCode);
        }

        this.rooms.delete(roomCode);
      }, 30000);
    }
  }
}