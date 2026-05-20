import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type Player = {
  id: string;
  nickname: string;
  score: number;
  answeredQuestions: number[];
};

type Room = {
  code: string;
  hostId: string;
  players: Player[];
  currentQuestionIndex: number;
  started: boolean;
  acceptingAnswers: boolean;
  questionOrder: number[];
};

const questions = [
  {
    category: 'Geografija',
    question: 'Koji je glavni grad Hrvatske?',
    options: ['Split', 'Zagreb', 'Rijeka', 'Osijek'],
    correctAnswer: 'Zagreb',
  },
  {
    category: 'Matematika',
    question: 'Koliko je 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
  },
  {
    category: 'Računarstvo',
    question: 'Što znači HTML?',
    options: [
      'HyperText Markup Language',
      'HighText Machine Language',
      'HyperTool Multi Language',
      'HomeText Markup Language',
    ],
    correctAnswer: 'HyperText Markup Language',
  },
  {
    category: 'Računarstvo',
    question: 'Koji se jezik najčešće koristi za stiliziranje web stranica?',
    options: ['HTML', 'CSS', 'SQL', 'Python'],
    correctAnswer: 'CSS',
  },
  {
    category: 'Sport',
    question: 'Koliko igrača ima nogometna momčad na terenu?',
    options: ['9', '10', '11', '12'],
    correctAnswer: '11',
  },
];

function shuffleArray(array: number[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  private rooms: Map<string, Room> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private startQuestionTimer(room: Room) {
    let timeLeft = 15;

    room.acceptingAnswers = true;

    this.server.to(room.code).emit('timer_updated', timeLeft);

    const timer = setInterval(() => {
      timeLeft--;

      this.server.to(room.code).emit('timer_updated', timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timer);

        this.timers.delete(room.code);

        room.acceptingAnswers = false;

        this.server.to(room.code).emit('question_ended', {
          players: room.players,
        });
      }
    }, 1000);

    this.timers.set(room.code, timer);
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
      questionOrder: shuffleArray(
        questions.map((_, index) => index),
      ),
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
      client.emit('error_message', 'Room not found');
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

  @SubscribeMessage('start_game')
  startGame(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
      client.emit('error_message', 'Samo host može pokrenuti igru.');
      return;
    }

    room.started = true;
    room.currentQuestionIndex = 0;

    const question =
      questions[room.questionOrder[room.currentQuestionIndex]];

    this.server.to(room.code).emit('game_started', {
      question,
      questionNumber: room.currentQuestionIndex + 1,
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

    const question =
      questions[room.questionOrder[room.currentQuestionIndex]];

    const player = room.players.find(
      (p) => p.id === client.id,
    );

    if (!player) return;

    if (
      player.answeredQuestions.includes(
        room.currentQuestionIndex,
      )
    ) {
      client.emit(
        'error_message',
        'Već si odgovorio na ovo pitanje.',
      );

      return;
    }

    player.answeredQuestions.push(
      room.currentQuestionIndex,
    );

    const isCorrect =
      data.answer === question.correctAnswer;

    if (isCorrect) {
      player.score += 1000;
    }

    client.emit('answer_result', {
      isCorrect,
      correctAnswer: question.correctAnswer,
    });

    this.server
      .to(room.code)
      .emit('leaderboard_updated', room.players);
  }

  @SubscribeMessage('next_question')
  nextQuestion(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomCode);

    if (!room) return;

    if (room.hostId !== client.id) {
      client.emit(
        'error_message',
        'Samo host može prebaciti pitanje.',
      );

      return;
    }

    const oldTimer = this.timers.get(room.code);

    if (oldTimer) {
      clearInterval(oldTimer);

      this.timers.delete(room.code);
    }

    room.currentQuestionIndex++;

    if (
      room.currentQuestionIndex >=
      room.questionOrder.length
    ) {
      room.acceptingAnswers = false;

      this.server.to(room.code).emit('game_finished', {
        players: room.players,
      });

      return;
    }

    const question =
      questions[room.questionOrder[room.currentQuestionIndex]];

    this.server.to(room.code).emit('question_started', {
      question,
      questionNumber: room.currentQuestionIndex + 1,
    });

    this.startQuestionTimer(room);
  }
}