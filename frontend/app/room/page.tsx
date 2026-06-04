'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const socket = io(API_URL || 'http://localhost:3000');

type Player = {
  id: string;
  nickname: string;
  score: number;
  correctAnswers?: number;
  answeredQuestions?: number[];
  isReady?: boolean;
  userId?: string;
  connected?: boolean;
};

type Room = {
  code: string;
  hostId: string;
  hostUserId?: string;
  started?: boolean;
  players: Player[];
  selectedCategory?: string;
  questionCount?: number;
  timePerQuestion?: number;
};

type Question = {
  category: string;
  question: string;
  options: string[];
};

type ChatMessage = {
  nickname: string;
  message: string;
  createdAt: string;
};

type User = {
  id: string;
  username: string;
  email: string;
  role?: string;
  avatar?: string;
};

type Friend = {
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    username: string;
    avatar?: string;
  };
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export default function RoomPage() {
  const [nickname, setNickname] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [questionEnded, setQuestionEnded] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [questionCount, setQuestionCount] = useState(10);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const finishSoundPlayedRef = useRef(false);
  const initializedRef = useRef(false);

  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    pointsEarned: number;
  } | null>(null);

  const shouldShowLeaderboard = hasAnswered || questionEnded;

  const currentPlayer = room?.players.find((player) => {
    if (user?.id && player.userId) {
      return player.userId === user.id;
    }

    return player.nickname === nickname;
  });

  const isHost =
    !!room &&
    ((!!user?.id && room.hostUserId === user.id) ||
      (!!currentPlayer && room.hostId === currentPlayer.id));

  const isLastQuestion = questionNumber >= totalQuestions;

  function playSound(name: string) {
    const audio = new Audio(`/sounds/${name}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }

  function saveCurrentRoom(roomData: Room) {
    localStorage.setItem('currentRoom', JSON.stringify(roomData));
    localStorage.setItem('lastRoomCode', roomData.code);
  }

  function getFriendData(friend: Friend) {
    if (!user) return friend.receiver;

    return friend.sender.id === user.id ? friend.receiver : friend.sender;
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedNickname = localStorage.getItem('nickname');
    const savedRoom = localStorage.getItem('currentRoom');

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const roomFromUrl = params.get('room');

    let parsedUser: User | null = null;
    let finalNickname = savedNickname || 'Guest';

    if (savedUser) {
      const userFromStorage = JSON.parse(savedUser) as User;

      parsedUser = userFromStorage;
      finalNickname = userFromStorage.username || 'Guest';

      setUser(userFromStorage);
      setNickname(userFromStorage.username || '');

      socket.emit('join_user_channel', {
        userId: userFromStorage.id,
      });

      fetch(`${API_URL}/users/me/friends`, {
        headers: getAuthHeaders(),
      })
        .then((res) => res.json())
        .then((data) => setFriends(Array.isArray(data) ? data : []))
        .catch(() => setFriends([]));
    } else if (savedNickname) {
      setNickname(savedNickname);
    }

    socket.on('room_created', (roomData: Room) => {
      console.log('ROOM CREATED', roomData);
      setRoom(roomData);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setTotalPlayers(roomData.players.length);
      setQuestionCount(roomData.questionCount ?? 10);
      setTimePerQuestion(roomData.timePerQuestion ?? 15);
      saveCurrentRoom(roomData);
    });

    socket.on('room_updated', (roomData: Room) => {
      setRoom(roomData);
      setTotalPlayers(roomData.players.length);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setQuestionCount(roomData.questionCount ?? 10);
      setTimePerQuestion(roomData.timePerQuestion ?? 15);
      saveCurrentRoom(roomData);
    });

    socket.on('player_joined', (roomData: Room) => {
      setRoom(roomData);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setTotalPlayers(roomData.players.length);
      saveCurrentRoom(roomData);
    });

    socket.on('category_updated', (data: { category: string }) => {
      setSelectedCategory(data.category);
    });

    socket.on('new_message', (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on(
      'game_started',
      (data: {
        question: Question;
        questionNumber: number;
        totalQuestions: number;
        answeredCount: number;
        totalPlayers: number;
        timePerQuestion?: number;
      }) => {
        finishSoundPlayedRef.current = false;
        playSound('start');

        setQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setAnsweredCount(data.answeredCount);
        setTotalPlayers(data.totalPlayers);
        setTimeLeft(data.timePerQuestion ?? timePerQuestion);
        setLeaderboard([]);
        setGameFinished(false);
        setQuestionEnded(false);
        setHasAnswered(false);
        setAnswerResult(null);
        setErrorMessage('');
      },
    );

    socket.on(
      'question_started',
      (data: {
        question: Question;
        questionNumber: number;
        totalQuestions: number;
        answeredCount: number;
        totalPlayers: number;
        timePerQuestion?: number;
      }) => {
        setQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setAnsweredCount(data.answeredCount);
        setTotalPlayers(data.totalPlayers);
        setTimeLeft(data.timePerQuestion ?? timePerQuestion);
        setLeaderboard([]);
        setQuestionEnded(false);
        setHasAnswered(false);
        setAnswerResult(null);
        setErrorMessage('');
      },
    );

    socket.on('timer_updated', (time: number) => {
      setTimeLeft(time);
    });

    socket.on(
      'answer_result',
      (result: {
        isCorrect: boolean;
        correctAnswer: string;
        pointsEarned: number;
        players: Player[];
        answeredCount: number;
        totalPlayers: number;
      }) => {
        playSound(result.isCorrect ? 'correct' : 'wrong');

        setAnswerResult({
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          pointsEarned: result.pointsEarned,
        });

        setAnsweredCount(result.answeredCount);
        setTotalPlayers(result.totalPlayers);
        setLeaderboard([...result.players].sort((a, b) => b.score - a.score));
      },
    );

    socket.on(
      'answer_status_updated',
      (data: { answeredCount: number; totalPlayers: number }) => {
        setAnsweredCount(data.answeredCount);
        setTotalPlayers(data.totalPlayers);
      },
    );

    socket.on(
      'question_ended',
      (data: {
        players: Player[];
        answeredCount: number;
        totalPlayers: number;
      }) => {
        setQuestionEnded(true);
        setAnsweredCount(data.answeredCount);
        setTotalPlayers(data.totalPlayers);
        setLeaderboard([...data.players].sort((a, b) => b.score - a.score));
      },
    );

    socket.on('game_finished', (data: { players: Player[]; room: Room }) => {
      const sortedPlayers = [...data.players].sort(
        (a, b) => b.score - a.score,
      );

      localStorage.setItem('roomLeaderboard', JSON.stringify(sortedPlayers));
      saveCurrentRoom(data.room);

      if (!finishSoundPlayedRef.current) {
        playSound('finish');
        finishSoundPlayedRef.current = true;

        const savedHistory = localStorage.getItem('roomGameHistory');
        const gameHistory = savedHistory ? JSON.parse(savedHistory) : [];

        gameHistory.push({
          gameNumber: gameHistory.length + 1,
          playedAt: new Date().toISOString(),
          players: sortedPlayers,
        });

        localStorage.setItem('roomGameHistory', JSON.stringify(gameHistory));
      }

      setQuestion(null);
      setRoom(data.room);
      setGameFinished(true);
      setQuestionEnded(false);
      setHasAnswered(false);
      setAnswerResult(null);
      setLeaderboard(sortedPlayers);
    });

    socket.on('error_message', (message: string) => {
      setErrorMessage(message);

      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    });

    if (!initializedRef.current) {
      initializedRef.current = true;

      if (mode === 'create') {
        console.log('EMIT CREATE ROOM');
        socket.emit('create_room', {
          nickname: finalNickname,
          userId: parsedUser?.id,
          questionCount,
          timePerQuestion,
        });
      } else if (roomFromUrl && finalNickname) {
        socket.emit('join_room', {
          roomCode: roomFromUrl.toUpperCase(),
          nickname: finalNickname,
          userId: parsedUser?.id,
        });
      } else if (savedRoom) {
        const parsedRoom = JSON.parse(savedRoom) as Room;

        setRoom(parsedRoom);
        setSelectedCategory(parsedRoom.selectedCategory ?? 'All');
        setTotalPlayers(parsedRoom.players.length);
        setQuestionCount(parsedRoom.questionCount ?? 10);
        setTimePerQuestion(parsedRoom.timePerQuestion ?? 15);
      }
    }

    return () => {
      socket.off('room_created');
      socket.off('room_updated');
      socket.off('player_joined');
      socket.off('category_updated');
      socket.off('new_message');
      socket.off('game_started');
      socket.off('question_started');
      socket.off('timer_updated');
      socket.off('answer_result');
      socket.off('answer_status_updated');
      socket.off('question_ended');
      socket.off('game_finished');
      socket.off('error_message');
    };
  }, []);

  

  function changeCategory(category: string) {
    if (!room) return;

    playSound('click');
    setSelectedCategory(category);

    socket.emit('set_category', {
      roomCode: room.code,
      category,
    });
  }

  function toggleReady() {
    if (!room) return;

    playSound('click');

    socket.emit('toggle_ready', {
      roomCode: room.code,
    });
  }

  function startGame() {
    if (!room) return;

    playSound('click');

    socket.emit('start_game', {
      roomCode: room.code,
      questionCount,
      timePerQuestion,
    });
  }

  function submitAnswer(answer: string) {
    if (!room || hasAnswered || questionEnded) return;

    playSound('click');
    setHasAnswered(true);

    socket.emit('submit_answer', {
      roomCode: room.code,
      answer,
    });
  }

  function nextQuestion() {
    if (!room) return;

    playSound('click');

    socket.emit('next_question', {
      roomCode: room.code,
    });
  }

  function sendMessage() {
    if (!room || !chatInput.trim()) return;

    playSound('click');

    socket.emit('send_message', {
      roomCode: room.code,
      nickname,
      message: chatInput,
    });

    setChatInput('');
  }

  async function inviteFriend(friendId: string) {
    if (!user || !room) return;

    playSound('click');

    const res = await fetch(`${API_URL}/users/invite-room`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        toUserId: friendId,
        roomCode: room.code,
      }),
    });

    if (!res.ok) {
      alert('Greška kod slanja pozivnice.');
      return;
    }

    alert('Pozivnica poslana!');
  }

  function leaveRoom() {
    playSound('leave-room');

    localStorage.removeItem('currentRoom');

    setTimeout(() => {
      window.location.href = '/';
    }, 400);
  }

  if (gameFinished) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-6 text-white">
        <div className="w-full max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
          <h1 className="mb-8 text-center text-5xl font-bold">Game Over</h1>

          <div className="space-y-4">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl bg-zinc-700 p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {index === 0
                      ? '🥇'
                      : index === 1
                        ? '🥈'
                        : index === 2
                          ? '🥉'
                          : '🎮'}
                  </span>

                  <img
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                    className="h-14 w-14 rounded-full"
                    alt=""
                  />

                  <div>
                    <p className="text-xl font-bold">{player.nickname}</p>
                    <p className="text-sm text-zinc-400">#{index + 1} mjesto</p>
                  </div>
                </div>

                <span className="text-2xl font-bold">{player.score}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              playSound('click');
              finishSoundPlayedRef.current = false;
              setGameFinished(false);
              setQuestion(null);
              setQuestionEnded(false);
              setHasAnswered(false);
              setAnswerResult(null);
              setLeaderboard([]);
            }}
            className="mt-8 w-full rounded-xl bg-blue-600 p-4 text-xl font-bold hover:bg-blue-700"
          >
            Igraj ponovno
          </button>

          <a
            href="/leaderboard"
            className="mt-4 block text-center text-blue-400 hover:underline"
          >
            Pogledaj leaderboard i statistike sobe
          </a>
        </div>
      </main>
    );
  }

  if (question) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-6 text-white">
        <div className="w-full max-w-xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
          {errorMessage && (
            <div className="mb-6 rounded-lg bg-yellow-500 p-3 text-center font-bold text-black">
              {errorMessage}
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Vrijeme: {timeLeft}s</h2>

            {hasAnswered && (
              <span className="rounded-lg bg-green-600 px-3 py-1 text-sm font-bold">
                Odgovoreno
              </span>
            )}
          </div>

          <div className="mb-6 rounded-lg bg-zinc-700 p-3 text-center">
            Odgovorilo je {answeredCount} / {totalPlayers} igrača
          </div>

          <p className="mb-2 text-center text-sm uppercase tracking-widest text-purple-400">
            {question.category}
          </p>

          <p className="mb-4 text-center text-lg text-zinc-300">
            Pitanje {questionNumber} / {totalQuestions}
          </p>

          <h1 className="mb-8 text-3xl font-bold">{question.question}</h1>

          <div className="space-y-4">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => submitAnswer(option)}
                disabled={hasAnswered || questionEnded}
                className="w-full rounded-lg bg-blue-600 p-4 text-left font-bold hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-600"
              >
                {option}
              </button>
            ))}
          </div>

          {answerResult && (
            <div
              className={`mt-6 rounded-lg p-3 text-center font-bold ${
                answerResult.isCorrect ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {answerResult.isCorrect
                ? `Točan odgovor! +${answerResult.pointsEarned} bodova`
                : `Netočno! Točan odgovor je: ${answerResult.correctAnswer}`}
            </div>
          )}

          {questionEnded && (
            <p className="mt-6 rounded-lg bg-red-600 p-3 text-center font-bold">
              Pitanje je završeno!
            </p>
          )}

          {shouldShowLeaderboard && leaderboard.length > 0 && (
            <div className="mt-8 rounded-xl bg-zinc-700 p-4">
              <h2 className="mb-2 text-center text-3xl font-bold">
                🏆 Room Leaderboard
              </h2>

              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl bg-zinc-800 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">
                        {index === 0
                          ? '🥇'
                          : index === 1
                            ? '🥈'
                            : index === 2
                              ? '🥉'
                              : '🎮'}
                      </span>

                      <img
                        src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                        className="h-12 w-12 rounded-full"
                        alt=""
                      />

                      <div>
                        <p className="font-bold">{player.nickname}</p>
                        <p className="text-sm text-zinc-400">
                          #{index + 1} mjesto
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">{player.score}</p>
                      <p className="text-xs text-zinc-400">bodova</p>
                    </div>
                  </div>
                ))}
              </div>

              {isHost && (
                <button
                  onClick={nextQuestion}
                  className="mt-6 w-full rounded-lg bg-purple-600 p-3 font-bold hover:bg-purple-700"
                >
                  {isLastQuestion
                    ? '🏁 Pogledaj rezultate'
                    : '➡️ Sljedeće pitanje'}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 p-6 text-white">
        <div className="rounded-2xl bg-zinc-800 p-8 text-center shadow-xl">
          <h1 className="mb-4 text-3xl font-bold">Učitavanje sobe...</h1>

          {errorMessage && (
            <p className="mb-4 rounded-lg bg-red-600 p-3 font-bold">
              {errorMessage}
            </p>
          )}

          <a href="/" className="text-blue-400 hover:underline">
            ← Nazad na početnu
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-5xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-600 p-3 text-center font-bold">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold">Soba: {room.code}</h1>
            <p className="text-zinc-400">
              {isHost ? 'Ti si host sobe' : 'Čekaš da host pokrene igru'}
            </p>
          </div>

          <button
            onClick={leaveRoom}
            className="rounded-lg bg-red-600 px-5 py-3 font-bold hover:bg-red-700"
          >
            Napusti sobu
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl bg-zinc-700 p-6 lg:col-span-2">
            <h2 className="mb-4 text-2xl font-bold">Igrači</h2>

            <div className="space-y-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800 p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                      className="h-12 w-12 rounded-full"
                      alt=""
                    />

                    <div>
                      <p className="font-bold">
                        {player.nickname}{' '}
                        {player.id === room.hostId && (
                          <span className="text-yellow-400">(Host)</span>
                        )}
                      </p>

                      <p className="text-sm text-zinc-400">
                        {player.connected === false ? 'Offline' : 'Online'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-lg px-3 py-1 text-sm font-bold ${
                      player.isReady ? 'bg-green-600' : 'bg-zinc-600'
                    }`}
                  >
                    {player.isReady ? 'Ready' : 'Not ready'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={toggleReady}
              className="mt-6 w-full rounded-lg bg-green-600 p-3 font-bold hover:bg-green-700"
            >
              {currentPlayer?.isReady ? 'Makni ready' : 'Ready'}
            </button>
          </section>

          <section className="rounded-xl bg-zinc-700 p-6">
            <h2 className="mb-4 text-2xl font-bold">Postavke</h2>

            <label className="mb-2 block text-sm text-zinc-300">
              Kategorija
            </label>

            <select
              value={selectedCategory}
              onChange={(e) => changeCategory(e.target.value)}
              disabled={!isHost || room.started}
              className="mb-4 w-full rounded-lg p-3 text-black disabled:opacity-50"
            >
              <option value="All">Sve kategorije</option>
              <option value="Geografija">Geografija</option>
              <option value="Matematika">Matematika</option>
              <option value="Računarstvo">Računarstvo</option>
              <option value="Sport">Sport</option>
            </select>

            <label className="mb-2 block text-sm text-zinc-300">
              Broj pitanja
            </label>

            <input
              type="number"
              min={1}
              max={30}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={!isHost || room.started}
              className="mb-4 w-full rounded-lg p-3 text-black disabled:opacity-50"
            />

            <label className="mb-2 block text-sm text-zinc-300">
              Vrijeme po pitanju
            </label>

            <input
              type="number"
              min={5}
              max={60}
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(Number(e.target.value))}
              disabled={!isHost || room.started}
              className="mb-4 w-full rounded-lg p-3 text-black disabled:opacity-50"
            />

            {isHost && (
              <button
                onClick={startGame}
                className="w-full rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-700"
              >
                Pokreni igru
              </button>
            )}
          </section>
        </div>

        {friends.length > 0 && (
          <section className="mt-8 rounded-xl bg-zinc-700 p-6">
            <h2 className="mb-4 text-2xl font-bold">Pozovi prijatelje</h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => {
                const friendData = getFriendData(friend);

                return (
                  <button
                    key={friendData.id}
                    onClick={() => inviteFriend(friendData.id)}
                    className="rounded-lg bg-zinc-800 p-4 text-left hover:bg-zinc-600"
                  >
                    <p className="font-bold">{friendData.username}</p>
                    <p className="text-sm text-zinc-400">Pošalji pozivnicu</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-xl bg-zinc-700 p-6">
          <h2 className="mb-4 text-2xl font-bold">Chat</h2>

          <div className="mb-4 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-zinc-800 p-4">
            {chatMessages.length === 0 ? (
              <p className="text-zinc-400">Još nema poruka.</p>
            ) : (
              chatMessages.map((message, index) => (
                <div key={`${message.createdAt}-${index}`}>
                  <span className="font-bold">{message.nickname}: </span>
                  <span>{message.message}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              className="w-full rounded-lg p-3 text-black"
              placeholder="Napiši poruku..."
            />

            <button
              onClick={sendMessage}
              className="rounded-lg bg-blue-600 px-5 font-bold hover:bg-blue-700"
            >
              Pošalji
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}