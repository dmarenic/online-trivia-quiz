import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayDisconnect {
  constructor(private prisma: PrismaService) {}

  @WebSocketServer()
  server!: Server;

  private rooms: Map<string, Room> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

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
  joinUserChannel(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user_${data.userId}`);
  }

  @SubscribeMessage('send_room_invite')
  async sendRoomInvite(
    @MessageBody()
    data: {
      fromUserId: string;
      fromUsername: string;
      toUserId: string;
      roomCode: string;
    },
  ) {
    const invite = await this.prisma.roomInvite.create({
      data: {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        roomCode: data.roomCode,
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
  userId?: string;
  questionCount?: number;
  timePerQuestion?: number;
},
    @ConnectedSocket() client: Socket,
  ) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const questionCount = Number(data.questionCount) || 10;
    const timePerQuestion = Number(data.timePerQuestion) || 15;

    const player: Player = {
      id: client.id,
      nickname: data.nickname,
      score: 0,
      correctAnswers: 0,
      answeredQuestions: [],
      userId: data.userId,
      isReady: true,
      connected: true,
    };

    const room: Room = {
      code: roomCode,
      hostId: client.id,
      hostUserId: data.userId,
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
    @MessageBody() data: { roomCode: string; nickname: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) {
      client.emit('error_message', 'Soba nije pronađena.');
      return;
    }

    if (room.started) {
      client.emit('error_message', 'Igra je već počela.');
      return;
    }

    const reconnectingPlayer = room.players.find((player) => {
  if (data.userId && player.userId) {
    return player.userId === data.userId;
  }

  return player.nickname === data.nickname;
});

if (reconnectingPlayer) {
  reconnectingPlayer.id = client.id;
  reconnectingPlayer.connected = true;
  client.join(room.code);

  if (room.hostUserId && data.userId && room.hostUserId === data.userId) {
    room.hostId = client.id;
    reconnectingPlayer.isReady = true;
  }

  client.emit('room_updated', room);
  this.server.to(room.code).emit('room_updated', room);
  return;
}

if (room.players.length === 0) {
  room.hostId = client.id;
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
      nickname: data.nickname,
      score: 0,
      correctAnswers: 0,
      answeredQuestions: [],
      userId: data.userId,
      isReady: room.players.length === 0,
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
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
      client.emit('error_message', 'Samo host može mijenjati kategoriju.');
      return;
    }

    if (room.started) {
      client.emit('error_message', 'Kategorija se ne može mijenjati tijekom igre.');
      return;
    }

    room.selectedCategory = data.category;

    this.server.to(room.code).emit('category_updated', {
      category: data.category,
    });

    this.server.to(room.code).emit('room_updated', room);
  }

  @SubscribeMessage('toggle_ready')
  toggleReady(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    const player = room.players.find((p) => p.id === client.id);

    if (!player) return;

    if (player.id === room.hostId) {
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
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
      client.emit('error_message', 'Samo host može pokrenuti igru.');
      return;
    }

    const allReady = room.players.every(
      (player) => player.id === room.hostId || player.isReady,
    );

    if (!allReady) {
      client.emit('error_message', 'Svi igrači moraju biti ready.');
      return;
    }

    const questionCount = Number(data.questionCount) || room.questionCount || 10;
    const timePerQuestion =
      Number(data.timePerQuestion) || room.timePerQuestion || 15;

    room.questionCount = questionCount;
    room.timePerQuestion = timePerQuestion;

    const allQuestions = await this.getQuestionsForCategory(room.selectedCategory);

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
      isReady: player.id === room.hostId ? true : player.isReady,
    }));

    const firstQuestion = room.questions[0];

    this.server.to(room.code).emit('game_started', {
      question: firstQuestion,
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
    const room = this.rooms.get(data.roomCode);

    if (!room || !room.started || !room.acceptingAnswers) return;

    const player = room.players.find((p) => p.id === client.id);

    if (!player) return;

    if (player.answeredQuestions.includes(room.currentQuestionIndex)) return;

    const question = room.questions[room.currentQuestionIndex];

    if (!question) return;

    player.answeredQuestions.push(room.currentQuestionIndex);

    const responseTimeMs = Date.now() - room.questionStartTime;
    const isCorrect = data.answer === question.correctAnswer;

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
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
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
        isReady: player.id === room.hostId,
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
      question: nextQuestion,
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
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    this.server.to(room.code).emit('new_message', {
      nickname: data.nickname,
      message: data.message,
      createdAt: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
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