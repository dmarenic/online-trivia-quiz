import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma/prisma.service';

type Player = {
  id: string;
  nickname: string;
  score: number;
  answeredQuestions: number[];
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
  players: Player[];
  currentQuestionIndex: number;
  started: boolean;
  acceptingAnswers: boolean;
  selectedCategory: string;
  questionStartTime: number;
  questions: QuizQuestion[];
};

const QUESTION_TIME = 15;

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway {
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
    let timeLeft = QUESTION_TIME;

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
      options: [
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
      ],
      correctAnswer: question.correctAnswer,
    }));
  }

  @SubscribeMessage('create_room')
  createRoom(
    @MessageBody() data: { nickname: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const player: Player = {
      id: client.id,
      nickname: data.nickname,
      score: 0,
      answeredQuestions: [],
    };

    const room: Room = {
      code: roomCode,
      hostId: client.id,
      players: [player],
      currentQuestionIndex: 0,
      started: false,
      acceptingAnswers: false,
      selectedCategory: 'All',
      questionStartTime: 0,
      questions: [],
    };

    this.rooms.set(roomCode, room);
    client.join(roomCode);

    client.emit('room_created', room);
  }

  @SubscribeMessage('join_room')
  joinRoom(
    @MessageBody() data: { roomCode: string; nickname: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) {
      client.emit('error_message', 'Soba nije pronađena.');
      return;
    }

    const player: Player = {
      id: client.id,
      nickname: data.nickname,
      score: 0,
      answeredQuestions: [],
    };

    room.players.push(player);
    client.join(data.roomCode);

    this.server.to(data.roomCode).emit('player_joined', room);
  }

  @SubscribeMessage('set_category')
  setCategory(
    @MessageBody() data: { roomCode: string; category: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
      client.emit('error_message', 'Samo host može odabrati kategoriju.');
      return;
    }

    if (room.started) {
      client.emit(
        'error_message',
        'Kategoriju nije moguće mijenjati nakon početka igre.',
      );
      return;
    }

    room.selectedCategory = data.category;

    this.server.to(room.code).emit('category_updated', {
      category: room.selectedCategory,
    });
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
    this.server.to(data.roomCode).emit('new_message', {
      nickname: data.nickname,
      message: data.message,
      createdAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('start_game')
  async startGame(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
      client.emit('error_message', 'Samo host može pokrenuti igru.');
      return;
    }

    const questions = await this.getQuestionsForCategory(room.selectedCategory);

    if (questions.length === 0) {
      client.emit('error_message', 'Nema pitanja za odabranu kategoriju.');
      return;
    }

    room.started = true;
    room.currentQuestionIndex = 0;
    room.questions = shuffleArray(questions);

    room.players = room.players.map((player) => ({
      ...player,
      score: 0,
      answeredQuestions: [],
    }));

    const question = room.questions[room.currentQuestionIndex];

    this.server.to(room.code).emit('game_started', {
      question,
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.questions.length,
      answeredCount: 0,
      totalPlayers: room.players.length,
    });

    this.startQuestionTimer(room);
  }

  @SubscribeMessage('submit_answer')
  submitAnswer(
    @MessageBody()
    data: {
      roomCode: string;
      answer: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (!room.acceptingAnswers) {
      client.emit('error_message', 'Vrijeme je isteklo.');
      return;
    }

    const question = room.questions[room.currentQuestionIndex];
    const player = room.players.find((p) => p.id === client.id);

    if (!question || !player) return;

    if (player.answeredQuestions.includes(room.currentQuestionIndex)) {
      client.emit('error_message', 'Već si odgovorio na ovo pitanje.');
      return;
    }

    player.answeredQuestions.push(room.currentQuestionIndex);

    const responseTimeMs = Date.now() - room.questionStartTime;
    const isCorrect = data.answer === question.correctAnswer;
    const pointsEarned = this.calculatePoints(isCorrect, responseTimeMs);

    player.score += pointsEarned;

    const answeredCount = this.getAnsweredCount(room);

    client.emit('answer_result', {
      isCorrect,
      correctAnswer: question.correctAnswer,
      pointsEarned,
      players: room.players,
      answeredCount,
      totalPlayers: room.players.length,
    });

    this.server.to(room.code).emit('answer_status_updated', {
      answeredCount,
      totalPlayers: room.players.length,
    });

    if (this.haveAllPlayersAnswered(room)) {
      this.endQuestion(room);
    }
  }

  @SubscribeMessage('next_question')
  async nextQuestion(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
      client.emit('error_message', 'Samo host može prebaciti pitanje.');
      return;
    }

    if (room.acceptingAnswers && !this.haveAllPlayersAnswered(room)) {
      client.emit(
        'error_message',
        `Ne možeš još dalje. Odgovorilo je ${this.getAnsweredCount(room)} / ${
          room.players.length
        } igrača.`,
      );
      return;
    }

    const oldTimer = this.timers.get(room.code);

    if (oldTimer) {
      clearInterval(oldTimer);
      this.timers.delete(room.code);
    }

    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
      room.acceptingAnswers = false;

      for (const player of room.players) {
        await this.prisma.gameResult.create({
          data: {
            nickname: player.nickname,
            score: player.score,
          },
        });
      }

      this.server.to(room.code).emit('game_finished', {
        players: room.players,
      });

      return;
    }

    const question = room.questions[room.currentQuestionIndex];

    this.server.to(room.code).emit('question_started', {
      question,
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.questions.length,
      answeredCount: 0,
      totalPlayers: room.players.length,
    });

    this.startQuestionTimer(room);
  }
}