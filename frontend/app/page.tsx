'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const socket = io(API_URL);

type Player = {
  id: string;
  nickname: string;
  score: number;
  answeredQuestions?: number[];
};

type Room = {
  code: string;
  hostId: string;
  players: Player[];
  selectedCategory?: string;
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

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [questionEnded, setQuestionEnded] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    pointsEarned: number;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    socket.on('room_created', (roomData: Room) => {
      setRoom(roomData);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setTotalPlayers(roomData.players.length);
    });

    socket.on('player_joined', (roomData: Room) => {
      setRoom(roomData);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setTotalPlayers(roomData.players.length);
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
      }) => {
        setQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setAnsweredCount(data.answeredCount);
        setTotalPlayers(data.totalPlayers);
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
      }) => {
        setQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setAnsweredCount(data.answeredCount);
        setTotalPlayers(data.totalPlayers);
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

    socket.on('game_finished', (data: { players: Player[] }) => {
      setQuestion(null);
      setGameFinished(true);
      setLeaderboard([...data.players].sort((a, b) => b.score - a.score));
    });

    socket.on('error_message', (message: string) => {
      setErrorMessage(message);

      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    });

    return () => {
      socket.off('room_created');
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

  function createRoom() {
    if (!nickname) return;
    socket.emit('create_room', { nickname });
  }

  function joinRoom() {
    if (!nickname || !roomCode) return;

    socket.emit('join_room', {
      roomCode,
      nickname,
    });
  }

  function changeCategory(category: string) {
    if (!room) return;

    setSelectedCategory(category);

    socket.emit('set_category', {
      roomCode: room.code,
      category,
    });
  }

  function submitAnswer(answer: string) {
    if (!room || hasAnswered || questionEnded) return;

    setHasAnswered(true);

    socket.emit('submit_answer', {
      roomCode: room.code,
      answer,
    });
  }

  function sendMessage() {
    if (!room || !chatInput.trim()) return;

    socket.emit('send_message', {
      roomCode: room.code,
      nickname,
      message: chatInput,
    });

    setChatInput('');
  }

  const shouldShowLeaderboard = hasAnswered || questionEnded;

  if (gameFinished) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-6">
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
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎮'}
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
            onClick={() => window.location.reload()}
            className="mt-8 w-full rounded-xl bg-blue-600 p-4 text-xl font-bold hover:bg-blue-700"
          >
            Igraj ponovno
          </button>

          <a
            href="/leaderboard"
            className="mt-4 block text-center text-blue-400 hover:underline"
          >
            Pogledaj globalni leaderboard
          </a>
        </div>
      </main>
    );
  }

  if (question) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
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
              <h2 className="mb-4 text-2xl font-bold">Leaderboard</h2>

              <div className="space-y-2">
                {leaderboard.map((player) => (
                  <div
                    key={player.id}
                    className="flex justify-between rounded-lg bg-zinc-800 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                        className="h-10 w-10 rounded-full"
                        alt=""
                      />

                      <span>{player.nickname}</span>
                    </div>

                    <span>{player.score} bodova</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  socket.emit('next_question', {
                    roomCode: room?.code,
                  })
                }
                className="mt-6 w-full rounded-lg bg-purple-600 p-3 font-bold hover:bg-purple-700"
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (room) {
    return (
      <main className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
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

          <div className="mb-6 rounded-lg bg-zinc-700 p-3 text-center">
            Odabrana kategorija: <b>{selectedCategory}</b>
          </div>

          <select
            className="mb-4 w-full rounded-lg bg-zinc-700 p-3 text-white"
            value={selectedCategory}
            onChange={(e) => changeCategory(e.target.value)}
          >
            <option value="All">Sve kategorije</option>
            <option value="Geografija">Geografija</option>
            <option value="Matematika">Matematika</option>
            <option value="Računarstvo">Računarstvo</option>
            <option value="Sport">Sport</option>
          </select>

          <button
            onClick={() =>
              socket.emit('start_game', {
                roomCode: room.code,
              })
            }
            className="mb-6 w-full rounded-lg bg-purple-600 p-3 font-bold hover:bg-purple-700"
          >
            Start Game
          </button>

          <div className="space-y-3">
            {room.players.map((player) => (
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

                {player.id === room.hostId && (
                  <span className="rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-black">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>

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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
      <div className="w-full max-w-md rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-4xl font-bold">
          Online Trivia Quiz
        </h1>

        <input
          className="mb-4 w-full rounded-lg bg-white p-3 text-black"
          placeholder="Unesi nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <button
          onClick={createRoom}
          className="mb-4 w-full rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-700"
        >
          Kreiraj sobu
        </button>

        <input
          className="mb-4 w-full rounded-lg bg-white p-3 text-black"
          placeholder="Unesi kod sobe"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />

        <button
          onClick={joinRoom}
          className="w-full rounded-lg bg-green-600 p-3 font-bold hover:bg-green-700"
        >
          Pridruži se sobi
        </button>

        <a
          href="/leaderboard"
          className="mt-4 block text-center text-sm text-blue-400 hover:underline"
        >
          Pogledaj globalni leaderboard
        </a>
      </div>
    </main>
  );
}