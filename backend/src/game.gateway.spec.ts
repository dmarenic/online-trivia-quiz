import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import * as crypto from 'crypto';
import { GameGateway } from './game.gateway';
import { PrismaService } from './prisma/prisma.service';

// crypto je Node core modul pa mu jest.spyOn ne može prepisati svojstva.
// Zato modul mockamo tako da sve delegira na pravu implementaciju, a samo je
// randomInt zamotan u jest.fn — testovi ga po potrebi mogu kontrolirati.
jest.mock('crypto', () => {
  const actual = jest.requireActual<typeof import('crypto')>('crypto');
  return { ...actual, randomInt: jest.fn(actual.randomInt) };
});

// Pomoćnici za testove: lažni socket klijent i soba u stanju "igra u tijeku".
// Sve je in-memory, kao i u produkcijskom gatewayu — baza se nigdje ne dira.

function makeClient(id: string) {
  return {
    id,
    emit: jest.fn(),
    join: jest.fn(),
    handshake: { auth: {} },
  } as unknown as Socket;
}

function makePlayer(id: string, nickname: string) {
  return {
    id,
    nickname,
    score: 0,
    correctAnswers: 0,
    answeredQuestions: [] as number[],
    isReady: true,
    connected: true,
  };
}

function makeActiveRoom(code: string, hostId: string, playerIds: string[]) {
  return {
    code,
    hostId,
    hostUserId: undefined,
    players: playerIds.map((id) => makePlayer(id, `igrac-${id}`)),
    currentQuestionIndex: 0,
    started: true,
    acceptingAnswers: true,
    selectedCategory: 'All',
    selectedDifficulty: 'All',
    questionStartTime: Date.now(),
    questions: [
      {
        id: 'q1',
        category: 'Sport',
        question: 'Koliko igrača ima nogometna momčad?',
        options: ['9', '10', '11', '12'],
        correctAnswer: '11',
      },
    ],
    questionCount: 1,
    timePerQuestion: 15,
  };
}

describe('GameGateway', () => {
  let gateway: GameGateway;

  const prismaMock = {
    question: {
      findMany: jest.fn(),
    },
    gameResult: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
  });

  describe('calculatePoints — bodovanje (baza 1000 + brzinski bonus do 500)', () => {
    it('trenutačan točan odgovor (0 ms) donosi maksimalnih 1500 bodova', () => {
      // Arrange
      const isCorrect = true;
      const responseTimeMs = 0;

      // Act
      const points = gateway['calculatePoints'](isCorrect, responseTimeMs);

      // Assert
      expect(points).toBe(1500);
    });

    it('točan odgovor nakon 3 sekunde donosi 1400 bodova (bonus umanjen za 3000/30 = 100)', () => {
      // Arrange
      const isCorrect = true;
      const responseTimeMs = 3000;

      // Act
      const points = gateway['calculatePoints'](isCorrect, responseTimeMs);

      // Assert
      expect(points).toBe(1400);
    });

    it('nakon isteka bonusa (15+ sekundi) ostaje baza od 1000 — bonus ne smije otići u minus', () => {
      // Arrange: 30000 ms bi bez zaštite dao bonus 500 - 1000 = -500
      const isCorrect = true;
      const responseTimeMs = 30000;

      // Act
      const points = gateway['calculatePoints'](isCorrect, responseTimeMs);

      // Assert
      expect(points).toBe(1000);
    });

    it('netočan odgovor donosi 0 bodova, bez obzira na brzinu', () => {
      // Arrange
      const isCorrect = false;
      const responseTimeMs = 0;

      // Act
      const points = gateway['calculatePoints'](isCorrect, responseTimeMs);

      // Assert
      expect(points).toBe(0);
    });
  });

  describe('submit_answer — tok odgovaranja na pitanje', () => {
    const NOW = 1_000_000_000;
    let serverEmit: jest.Mock;

    beforeEach(() => {
      // Fiksiramo "sada" da bodovi budu deterministični (bez utrke s pravim satom).
      jest.spyOn(Date, 'now').mockReturnValue(NOW);

      // Lažni Socket.IO server: hvatamo broadcast emitove prema sobi.
      serverEmit = jest.fn();
      gateway['server'] = {
        to: jest.fn(() => ({ emit: serverEmit })),
      } as never;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    // Soba s 2 igrača u kojoj je pitanje krenulo prije 3 sekunde.
    function arrangeRoomWithQuestionInProgress() {
      const room = makeActiveRoom('SOBA01', 'host-socket', [
        'host-socket',
        'gost-socket',
      ]);
      room.questionStartTime = NOW - 3000;
      gateway['rooms'].set(room.code, room);
      return room;
    }

    it('točan odgovor dodjeljuje bodove, broji točan odgovor i šalje answer_result s isCorrect=true', () => {
      // Arrange
      const room = arrangeRoomWithQuestionInProgress();
      const client = makeClient('gost-socket');

      // Act
      gateway.submitAnswer({ roomCode: 'SOBA01', answer: '11' }, client);

      // Assert
      const player = room.players.find((p) => p.id === 'gost-socket')!;
      expect(player.score).toBe(1400); // 1000 + (500 - 3000/30), kao u bloku calculatePoints
      expect(player.correctAnswers).toBe(1);
      expect(client.emit).toHaveBeenCalledWith(
        'answer_result',
        expect.objectContaining({ isCorrect: true, pointsEarned: 1400 }),
      );
    });

    it('netočan odgovor ne dodjeljuje bodove i šalje answer_result s isCorrect=false', () => {
      // Arrange
      const room = arrangeRoomWithQuestionInProgress();
      const client = makeClient('gost-socket');

      // Act
      gateway.submitAnswer({ roomCode: 'SOBA01', answer: '10' }, client);

      // Assert
      const player = room.players.find((p) => p.id === 'gost-socket')!;
      expect(player.score).toBe(0);
      expect(player.correctAnswers).toBe(0);
      expect(client.emit).toHaveBeenCalledWith(
        'answer_result',
        expect.objectContaining({ isCorrect: false, pointsEarned: 0 }),
      );
    });

    it('drugi odgovor istog igrača na isto pitanje se ignorira (nema duplog bodovanja)', () => {
      // Arrange
      const room = arrangeRoomWithQuestionInProgress();
      const client = makeClient('gost-socket');
      gateway.submitAnswer({ roomCode: 'SOBA01', answer: '11' }, client);
      const scoreAfterFirst = room.players.find(
        (p) => p.id === 'gost-socket',
      )!.score;

      // Act: pokušaj drugog odgovora na isto pitanje
      gateway.submitAnswer({ roomCode: 'SOBA01', answer: '11' }, client);

      // Assert: bodovi nepromijenjeni, answer_result poslan samo jednom
      const player = room.players.find((p) => p.id === 'gost-socket')!;
      expect(player.score).toBe(scoreAfterFirst);
      const answerResults = (client.emit as jest.Mock).mock.calls.filter(
        ([event]) => event === 'answer_result',
      );
      expect(answerResults).toHaveLength(1);
    });

    it('odgovor nakon isteka vremena (acceptingAnswers=false) se ignorira', () => {
      // Arrange
      const room = arrangeRoomWithQuestionInProgress();
      room.acceptingAnswers = false;
      const client = makeClient('gost-socket');

      // Act
      gateway.submitAnswer({ roomCode: 'SOBA01', answer: '11' }, client);

      // Assert: ništa se nije dogodilo — ni bodovi ni emit
      const player = room.players.find((p) => p.id === 'gost-socket')!;
      expect(player.score).toBe(0);
      expect(client.emit).not.toHaveBeenCalled();
    });

    it('odgovor prije početka igre (started=false) se ignorira', () => {
      // Arrange
      const room = arrangeRoomWithQuestionInProgress();
      room.started = false;
      const client = makeClient('gost-socket');

      // Act
      gateway.submitAnswer({ roomCode: 'SOBA01', answer: '11' }, client);

      // Assert
      const player = room.players.find((p) => p.id === 'gost-socket')!;
      expect(player.score).toBe(0);
      expect(client.emit).not.toHaveBeenCalled();
    });
  });

  describe('autorizacija host-akcija — non-host mora biti odbijen', () => {
    let serverEmit: jest.Mock;

    beforeEach(() => {
      serverEmit = jest.fn();
      gateway['server'] = {
        to: jest.fn(() => ({ emit: serverEmit })),
      } as never;
    });

    // Soba u lobbyju: host je 'host-socket', a testove radimo kao 'gost-socket'.
    function arrangeLobbyRoom() {
      const room = makeActiveRoom('SOBA01', 'host-socket', [
        'host-socket',
        'gost-socket',
      ]);
      room.started = false;
      room.acceptingAnswers = false;
      gateway['rooms'].set(room.code, room);
      return room;
    }

    it('non-host ne može pokrenuti igru (start_game)', async () => {
      // Arrange
      const room = arrangeLobbyRoom();
      const nonHost = makeClient('gost-socket');

      // Act
      await gateway.startGame(
        { roomCode: 'SOBA01', questionCount: 5, timePerQuestion: 15 },
        nonHost,
      );

      // Assert: odbijen porukom, igra nije krenula, baza nije ni taknuta
      expect(nonHost.emit).toHaveBeenCalledWith(
        'error_message',
        'Samo host može pokrenuti igru.',
      );
      expect(room.started).toBe(false);
      expect(prismaMock.question.findMany).not.toHaveBeenCalled();
    });

    it('non-host ne može prebaciti na sljedeće pitanje (next_question)', () => {
      // Arrange: igra u tijeku, pitanje završeno (čeka se host)
      const room = arrangeLobbyRoom();
      room.started = true;
      room.acceptingAnswers = false;
      const nonHost = makeClient('gost-socket');

      // Act
      gateway.nextQuestion({ roomCode: 'SOBA01' }, nonHost);

      // Assert: odbijen porukom, indeks pitanja nepromijenjen
      expect(nonHost.emit).toHaveBeenCalledWith(
        'error_message',
        'Samo host može prebaciti pitanje.',
      );
      expect(room.currentQuestionIndex).toBe(0);
    });

    it('non-host ne može izbaciti igrača (kick_player)', () => {
      // Arrange: gost pokušava izbaciti hosta iz sobe
      const room = arrangeLobbyRoom();
      const nonHost = makeClient('gost-socket');

      // Act
      gateway.kickPlayer(
        { roomCode: 'SOBA01', playerId: 'host-socket' },
        nonHost,
      );

      // Assert: odbijen porukom, oba igrača i dalje u sobi
      expect(nonHost.emit).toHaveBeenCalledWith(
        'error_message',
        'Samo host može izbacivati igrače.',
      );
      expect(room.players).toHaveLength(2);
    });
  });

  describe('regresija BUG-1 — javni payload sobe ne smije curiti odgovore', () => {
    let serverEmit: jest.Mock;

    beforeEach(() => {
      serverEmit = jest.fn();
      gateway['server'] = {
        to: jest.fn(() => ({ emit: serverEmit })),
      } as never;
    });

    // Aktivna soba čije pitanje sadrži prepoznatljiv "tajni" točan odgovor,
    // pa curenje možemo detektirati traženjem tog niza u cijelom payloadu.
    function arrangeRoomWithSecretAnswer() {
      const room = makeActiveRoom('SOBA01', 'host-socket', [
        'host-socket',
        'gost-socket',
      ]);
      room.questions = [
        {
          id: 'q1',
          category: 'Sport',
          question: 'Testno pitanje?',
          options: ['A', 'B', 'C', 'TAJNI-TOCAN-ODGOVOR'],
          correctAnswer: 'TAJNI-TOCAN-ODGOVOR',
        },
      ];
      room.questionStartTime = 123456789;
      gateway['rooms'].set(room.code, room);
      return room;
    }

    it('room_updated broadcast NE sadrži questions, correctAnswer ni questionStartTime', () => {
      // Arrange
      arrangeRoomWithSecretAnswer();
      const guest = makeClient('gost-socket');

      // Act: bilo koja akcija koja broadcasta stanje sobe (ovdje toggle_ready)
      gateway.toggleReady({ roomCode: 'SOBA01' }, guest);

      // Assert: uhvati emitirani payload i provjeri da nema povjerljivih polja
      const roomUpdated = serverEmit.mock.calls.find(
        ([event]) => event === 'room_updated',
      );
      expect(roomUpdated).toBeDefined();

      const payload = roomUpdated![1] as Record<string, unknown>;
      expect(payload.questions).toBeUndefined();
      expect(payload.questionStartTime).toBeUndefined();

      // Najjača provjera: serijaliziraj payload (kao Socket.IO prije slanja)
      // i potvrdi da se tajni odgovor NIGDJE ne pojavljuje. Napomena: tražimo
      // točno polje "correctAnswer": — igrači legitimno imaju brojač
      // "correctAnswers" (množina) koji ne smije aktivirati lažnu uzbunu.
      const serialized = JSON.stringify(payload);
      expect(serialized).not.toContain('TAJNI-TOCAN-ODGOVOR');
      expect(serialized).not.toContain('"correctAnswer":');
    });

    it('javni payload sobe sadrži isključivo whitelistana polja (svako novo polje mora biti svjesna odluka)', () => {
      // Arrange
      arrangeRoomWithSecretAnswer();
      const guest = makeClient('gost-socket');

      // Act
      gateway.toggleReady({ roomCode: 'SOBA01' }, guest);

      // Assert: točan popis polja koja toPublicRoom smije slati klijentima
      const roomUpdated = serverEmit.mock.calls.find(
        ([event]) => event === 'room_updated',
      );
      const payload = roomUpdated![1] as Record<string, unknown>;

      expect(Object.keys(payload).sort()).toEqual(
        [
          'acceptingAnswers',
          'code',
          'currentQuestionIndex',
          'hostId',
          'hostUserId',
          'players',
          'questionCount',
          'selectedCategory',
          'selectedDifficulty',
          'started',
          'timePerQuestion',
        ].sort(),
      );
    });
  });

  describe('generateRoomCode — generiranje koda sobe (regresija BUG-4)', () => {
    it('kod sobe ima uvijek točno 6 znakova', () => {
      // Arrange & Act: generiraj veći uzorak kodova
      const codes = Array.from({ length: 200 }, () =>
        gateway['generateRoomCode'](),
      );

      // Assert
      for (const code of codes) {
        expect(code).toHaveLength(6);
      }
    });

    it('kod koristi samo dopušteni alfabet — bez lako zamjenjivih 0/O i 1/I', () => {
      // Arrange
      const allowedAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

      // Act
      const codes = Array.from({ length: 200 }, () =>
        gateway['generateRoomCode'](),
      );

      // Assert: svaki znak je iz alfabeta; posebno naglašeno — nikad 0, O, 1 ili I
      for (const code of codes) {
        expect(code).toMatch(new RegExp(`^[${allowedAlphabet}]{6}$`));
        expect(code).not.toMatch(/[0O1I]/);
      }
    });

    it('kod koji već postoji u rooms mapi se regenerira (nema kolizije / pregazene sobe)', () => {
      // Arrange: soba s kodom 'AAAAAA' već postoji, a mockani crypto.randomInt
      // prvo "izvuče" baš AAAAAA (indeksi 0), pa u drugom pokušaju BBBBBB (indeksi 1).
      gateway['rooms'].set('AAAAAA', makeActiveRoom('AAAAAA', 'host', ['host']));

      const randomIntMock = crypto.randomInt as unknown as jest.Mock;
      const plannedIndices = [...Array(6).fill(0), ...Array(6).fill(1)];
      plannedIndices.forEach((index) => {
        randomIntMock.mockReturnValueOnce(index);
      });

      // Act
      const code = gateway['generateRoomCode']();

      // Assert: kolizija je detektirana i kod je regeneriran
      expect(code).toBe('BBBBBB');
      expect(gateway['rooms'].has('AAAAAA')).toBe(true);
      expect(randomIntMock).toHaveBeenCalledTimes(12);
    });
  });
});
