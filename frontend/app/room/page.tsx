'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const socket = io(API_URL);

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
  correctAnswer: string;
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
  const [friends, setFriends] = useState<any[]>([]);
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedNickname = localStorage.getItem('nickname');
    const savedRoom = localStorage.getItem('currentRoom');

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const roomFromUrl = params.get('room');

    let parsedUser: User | null = null;
    let finalNickname = savedNickname || '';

    if (savedUser) {
      const userFromStorage = JSON.parse(savedUser) as User;

      parsedUser = userFromStorage;
      finalNickname = userFromStorage.username;

      setUser(userFromStorage);
      setNickname(userFromStorage.username);

      socket.emit('join_user_channel', {
        userId: userFromStorage.id,
      });

      fetch(`${API_URL}/users/${userFromStorage.id}/friends`)
        .then((res) => res.json())
        .then((data) => setFriends(data))
        .catch(() => setFriends([]));
    } else if (savedNickname) {
      setNickname(savedNickname);
    }

    if (!initializedRef.current) {
      initializedRef.current = true;

      if (mode === 'create' && finalNickname) {
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

    socket.on('room_created', (roomData: Room) => {
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

  function inviteFriend(friendId: string) {
    if (!user || !room) return;

    playSound('click');

    socket.emit('send_room_invite', {
      fromUserId: user.id,
      fromUsername: user.username,
      toUserId: friendId,
      roomCode: room.code,
    });

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
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
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

              <p className="mb-6 text-center text-sm text-zinc-400">
                Trenutni poredak igrača u sobi
              </p>

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
      <main className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <div className="rounded-2xl bg-zinc-800 p-8 text-center shadow-xl">
          <h1 className="mb-4 text-3xl font-bold">Učitavanje sobe...</h1>

          {errorMessage && (
            <p className="mb-4 rounded-lg bg-red-600 p-3 font-bold">
              {errorMessage}
            </p>
          )}

          <a href="/" className="text-blue-400 hover:underline">
            ← Nazad na početni ekran
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <div className="w-full max-w-md rounded-2xl bg-zinc-800 p-8 shadow-xl">
        {errorMessage && (
          <div className="mb-6 rounded-lg bg-yellow-500 p-3 text-center font-bold text-black">
            {errorMessage}
          </div>
        )}

        <h1 className="mb-2 text-center text-4xl font-bold">Lobby</h1>

        <p className="mb-6 text-center text-xl">
          Room Code: <b>{room.code}</b>
        </p>

        <div className="mb-6 rounded-lg bg-zinc-700 p-4 text-center">
          <p className="font-bold">Postavke sobe</p>
          <p>Broj pitanja: {questionCount}</p>
          <p>Vrijeme po pitanju: {timePerQuestion}s</p>
          <p>Kategorija: {selectedCategory}</p>
        </div>

        <button
          onClick={() => {
            playSound('click');
            navigator.clipboard.writeText(
              `${window.location.origin}/?room=${room.code}`
            );
            alert('Invite link kopiran!');
          }}
          className="mb-6 w-full rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-700"
        >
          👥 Kopiraj invite link
        </button>

        <p className="mb-6 text-center text-sm text-zinc-400">
          Pošalji prijatelju link za automatski ulazak u sobu
        </p>

        {isHost && friends.length > 0 && (
          <div className="mb-6 rounded-xl bg-zinc-700 p-4">
            <h2 className="mb-4 text-xl font-bold">👥 Pozovi prijatelje</h2>

            <div className="space-y-3">
              {friends.map((friend) => {
                const realFriend =
                  friend.senderId === user?.id ? friend.receiver : friend.sender;

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-800 p-3"
                  >
                    <span>{realFriend.username}</span>

                    <button
                      onClick={() => inviteFriend(realFriend.id)}
                      className="rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700"
                    >
                      Pozovi
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <select
          className="mb-4 w-full rounded-lg bg-zinc-700 p-3 text-white disabled:bg-zinc-600"
          value={selectedCategory}
          disabled={!isHost || !!question}
          onChange={(e) => changeCategory(e.target.value)}
        >
          <option value="All">Sve kategorije</option>
          <option value="Geografija">Geografija</option>
          <option value="Matematika">Matematika</option>
          <option value="Računarstvo">Računarstvo</option>
          <option value="Sport">Sport</option>
        </select>

        {isHost && (
          <>
            <label className="block">
              Broj pitanja
              <input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="mt-2 w-full rounded-lg p-3 text-black"
              />
            </label>

            <label className="mt-4 block">
              Vrijeme po pitanju
              <input
                type="number"
                min={5}
                max={60}
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                className="mt-2 w-full rounded-lg p-3 text-black"
              />
            </label>

            <button
              onClick={startGame}
              className="mb-6 mt-6 w-full rounded-lg bg-purple-600 p-3 font-bold hover:bg-purple-700"
            >
              Start Game
            </button>
          </>
        )}

        <div className="space-y-3">
          {room.players
.filter((player) => player.connected !== false)
  .map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-lg bg-zinc-700 p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                  className="h-10 w-10 rounded-full"
                  alt=""
                />

                <span>{player.nickname}</span>
              </div>

              {player.id === room.hostId ? (
                <span className="rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-black">
                  HOST
                </span>
              ) : (
                <span
                  className={`rounded px-2 py-1 text-xs font-bold ${
                    player.isReady
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {player.isReady ? 'READY' : 'NOT READY'}
                </span>
              )}
            </div>
          ))}
        </div>

        {!isHost && (
          <button
            onClick={toggleReady}
            className="mt-6 w-full rounded-lg bg-green-600 p-3 font-bold hover:bg-green-700"
          >
            Spreman / Nisam spreman
          </button>
        )}

        <div className="mt-6 rounded-xl bg-zinc-700 p-4">
          <h2 className="mb-3 text-xl font-bold">Lobby Chat</h2>

          <div className="mb-4 max-h-40 space-y-2 overflow-y-auto">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-zinc-400">Još nema poruka.</p>
            ) : (
              chatMessages.map((chat, index) => (
                <div key={index} className="rounded-lg bg-zinc-800 p-2 text-sm">
                  <b>{chat.nickname}:</b> {chat.message}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg bg-white p-2 text-black"
              placeholder="Napiši poruku..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />

            <button
              onClick={sendMessage}
              className="rounded-lg bg-blue-600 px-4 font-bold hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>

        <button
          onClick={leaveRoom}
          className="mt-6 w-full rounded-lg bg-red-600 p-3 font-bold hover:bg-red-700"
        >
          Napusti sobu
        </button>
      </div>
    </main>
  );
}