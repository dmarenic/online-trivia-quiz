'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const socket = io(API_URL || 'http://localhost:3000', {
  autoConnect: false,
  auth: {
    token:
      typeof window !== 'undefined'
        ? localStorage.getItem('token')
        : null,
  },
});

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
  selectedDifficulty?: string;
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

const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

const inputClass =
  'w-full rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/70 px-4 py-3 text-[#E0E1DD] outline-none transition placeholder:text-[#778DA9] focus:border-[#778DA9]/55 focus:ring-4 focus:ring-[#778DA9]/10 disabled:cursor-not-allowed disabled:opacity-50';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const successButtonClass =
  'rounded-2xl bg-[#388E3C] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const dangerButtonClass =
  'rounded-2xl bg-[#C62828] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D32F2F] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  

  const finishSoundPlayedRef = useRef(false);
  const initializedRef = useRef(false);
function showToast(message: string, type: 'success' | 'error' = 'success') {
  setToast(message);
  setToastType(type);

  setTimeout(() => {
    setToast('');
  }, 3000);
}
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

  function changeDifficulty(difficulty: string) {
  if (!room) return;

  playSound('click');
  setSelectedDifficulty(difficulty);

  socket?.emit('set_difficulty', {
    roomCode: room.code,
    difficulty,
  });
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
    socket.auth = {
  token: localStorage.getItem('token'),
};

if (!socket.connected) {
  socket.connect();
}
    const savedUser = localStorage.getItem('user');
    const savedNickname = localStorage.getItem('nickname');
    const savedRoom = localStorage.getItem('currentRoom');

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const roomFromUrl = params.get('room');

    let finalNickname = savedNickname || 'Guest';

    if (savedUser) {
      const userFromStorage = JSON.parse(savedUser) as User;

      finalNickname = userFromStorage.username || 'Guest';

      setUser(userFromStorage);
      setNickname(userFromStorage.username || '');

      socket?.emit('join_user_channel');

      fetch(`${API_URL}/users/me/friends`, {
  headers: getAuthHeaders(),
})
  .then((res) => {
    if (!res.ok) {
      throw new Error('Greška kod dohvaćanja prijatelja.');
    }

    return res.json();
  })
        .then((data: { friends?: Friend[] }) => {
          setFriends(Array.isArray(data.friends) ? data.friends : []);
        })
        .catch(() => setFriends([]));
    } else if (savedNickname) {
      setNickname(savedNickname);
    }

    socket.on('kicked_from_room', () => {
      localStorage.removeItem('currentRoom');
      localStorage.removeItem('lastRoomCode');
      localStorage.removeItem('returnToRoom');
      showToast('Izbačen si iz sobe.', 'error');
      window.location.href = '/';
    });

    socket.on('room_created', (roomData: Room) => {
      console.log('ROOM CREATED', roomData);
      setRoom(roomData);
      saveCurrentRoom(roomData);
      localStorage.setItem('returnToRoom', `/room?room=${roomData.code}`);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setSelectedDifficulty(roomData.selectedDifficulty ?? 'All');
      setTotalPlayers(roomData.players.length);
      setQuestionCount(roomData.questionCount ?? 10);
      setTimePerQuestion(roomData.timePerQuestion ?? 15);
      saveCurrentRoom(roomData);
    });

    socket.on('room_updated', (roomData: Room) => {
      setRoom(roomData);
      saveCurrentRoom(roomData);
      localStorage.setItem('returnToRoom', `/room?room=${roomData.code}`);
      setTotalPlayers(roomData.players.length);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setSelectedDifficulty(roomData.selectedDifficulty ?? 'All');
      setQuestionCount(roomData.questionCount ?? 10);
      setTimePerQuestion(roomData.timePerQuestion ?? 15);
      saveCurrentRoom(roomData);
    });

    socket.on('player_joined', (roomData: Room) => {
      setRoom(roomData);
      saveCurrentRoom(roomData);
      localStorage.setItem('returnToRoom', `/room?room=${roomData.code}`);
      setSelectedCategory(roomData.selectedCategory ?? 'All');
      setSelectedDifficulty(roomData.selectedDifficulty ?? 'All');
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
        if (room) {
          saveCurrentRoom({
            ...room,
            started: true,
          });
        }
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
        if (room) {
          saveCurrentRoom({
            ...room,
            started: true,
          });
        }
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

        const historyKey = `roomGameHistory:${data.room.code}`;
        const savedHistory = localStorage.getItem(historyKey);
        const gameHistory = savedHistory ? JSON.parse(savedHistory) : [];

        gameHistory.push({
          gameNumber: gameHistory.length + 1,
          playedAt: new Date().toISOString(),
          roomCode: data.room.code,
          players: sortedPlayers,
        });

        localStorage.setItem(historyKey, JSON.stringify(gameHistory));
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
        socket?.emit('create_room', {
          nickname: finalNickname,
          questionCount,
          timePerQuestion,
        });
      } else if (roomFromUrl && finalNickname) {
        const parsedUser = savedUser ? (JSON.parse(savedUser) as User) : null;

        socket?.emit('join_room', {
          roomCode: roomFromUrl.toUpperCase(),
          nickname: finalNickname,
          userId: parsedUser?.id ?? null,
          reconnect: true,
        });
      } else if (savedRoom) {
        const parsedRoom = JSON.parse(savedRoom) as Room;

        setRoom(parsedRoom);
        setSelectedCategory(parsedRoom.selectedCategory ?? 'All');
        setSelectedDifficulty(parsedRoom.selectedDifficulty ?? 'All');
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
      socket.off('reconnected_to_game');
      socket.off('question_started');
      socket.off('timer_updated');
      socket.off('answer_result');
      socket.off('answer_status_updated');
      socket.off('question_ended');
      socket.off('game_finished');
      socket.off('error_message');
      socket.off('kicked_from_room');
    };
  }, [questionCount, timePerQuestion]);

  function changeCategory(category: string) {
    if (!room) return;

    playSound('click');
    setSelectedCategory(category);

    socket?.emit('set_category', {
      roomCode: room.code,
      category,
    });
  }

  function toggleReady() {
    if (!room) return;

    playSound('click');

    socket?.emit('toggle_ready', {
      roomCode: room.code,
    });
  }

  function startGame() {
    if (!room) return;

    playSound('click');

    socket?.emit('start_game', {
      roomCode: room.code,
      questionCount,
      timePerQuestion,
    });
  }

  function submitAnswer(answer: string) {
    if (!room || hasAnswered || questionEnded) return;

    playSound('click');
    setHasAnswered(true);

    socket?.emit('submit_answer', {
      roomCode: room.code,
      answer,
    });
  }

  function nextQuestion() {
    if (!room) return;

    playSound('click');

    socket?.emit('next_question', {
      roomCode: room.code,
    });
  }

  function sendMessage() {
  const trimmedMessage = chatInput.trim();

  if (!room || !trimmedMessage) return;

  if (trimmedMessage.length > 300) {
    setErrorMessage('Poruka može imati najviše 300 znakova.');
    return;
  }

  playSound('click');

  socket?.emit('send_message', {
    roomCode: room.code,
    nickname,
    message: trimmedMessage,
  });

  setChatInput('');
}

  async function inviteFriend(friendId: string) {
  if (!user || !room) return;
  if (invitingFriendId) return;

  setInvitingFriendId(friendId);

  try {
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
      showToast('Pozivnica nije poslana. Pokušaj ponovno.', 'error');

      return;
    }

    showToast('Pozivnica je uspješno poslana.', 'success');
  } catch (error) {
  console.error(error);
  showToast(
    'Došlo je do pogreške prilikom slanja pozivnice.',
    'error'
  );
} finally {
    setInvitingFriendId(null);
  }
}

  function leaveRoom() {
    playSound('leave-room');

    localStorage.removeItem('currentRoom');

    setTimeout(() => {
      window.location.href = '/';
    }, 400);
  }

  function kickPlayer(playerId: string) {
    if (!room || !isHost) return;

    socket.emit('kick_player', {
      roomCode: room.code,
      playerId,
    });
  }

  if (gameFinished) {
    return (
      <main className={`${shellClass} flex items-center justify-center p-4 sm:p-6`}>
        <div className={`${cardClass} w-full max-w-3xl p-5 sm:p-8`}>
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Final results
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Game Over
            </h1>
            <p className="mt-3 text-[#B8C4D6]">
              Završni poredak sobe i osvojeni bodovi.
            </p>
          </div>

          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#415A77]/35 text-xl">
                    {index === 0
                      ? '🥇'
                      : index === 1
                        ? '🥈'
                        : index === 2
                          ? '🥉'
                          : index + 1}
                  </span>

                  <Image
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                    width={56}
                    height={56}
                    className="h-12 w-12 rounded-full ring-2 ring-[#778DA9]/25 sm:h-14 sm:w-14"
                    alt={`${player.nickname} avatar`}
                    unoptimized
                  />

                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">
                      {player.nickname}
                    </p>
                    <p className="text-sm text-[#778DA9]">
                      #{index + 1} mjesto
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black">{player.score}</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#778DA9]">
                    bodova
                  </p>
                </div>
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
            className={`${successButtonClass} mt-8 w-full`}
          >
            Igraj ponovno
          </button>

          <Link
            href="/leaderboard"
            className="mt-4 block rounded-2xl border border-[#778DA9]/20 px-5 py-3 text-center font-bold text-[#E0E1DD] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
          >
            Pogledaj leaderboard i statistike sobe
          </Link>
        </div>
      </main>
    );
  }

  if (question) {
    const timerPercent = Math.max(
      0,
      Math.min(100, (timeLeft / timePerQuestion) * 100),
    );

    return (
      <main className={`${shellClass} flex items-center justify-center p-4 sm:p-6`}>
        <div className="w-full max-w-5xl">
          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-[#C62828]/30 bg-[#C62828]/15 p-4 text-center font-bold text-[#ffb4b4]">
              {errorMessage}
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-bold text-[#B8C4D6]">Vrijeme</p>
              <div className="mt-3 flex items-center gap-4">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#388E3C ${timerPercent}%, rgba(119,141,169,0.18) 0)`,
                  }}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#0D1B2A] text-xl font-black">
                    {timeLeft}
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black">{timeLeft}s</p>
                  <p className="text-sm text-[#778DA9]">preostalo</p>
                </div>
              </div>
            </div>

            <div className={`${cardClass} p-5 text-center`}>
              <p className="text-sm font-bold text-[#B8C4D6]">Progress</p>
              <p className="mt-2 text-4xl font-black">
                {questionNumber} / {totalQuestions}
              </p>
              <p className="mt-1 text-sm text-[#778DA9]">
                {answeredCount}/{totalPlayers} odgovorilo
              </p>
            </div>

            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-bold text-[#B8C4D6]">Status</p>
              <div className="mt-4">
                {hasAnswered ? (
                  <span className="inline-flex rounded-full border border-[#388E3C]/35 bg-[#388E3C]/15 px-4 py-2 text-sm font-black text-[#75d27a]">
                    Odgovoreno
                  </span>
                ) : questionEnded ? (
                  <span className="inline-flex rounded-full border border-[#C62828]/35 bg-[#C62828]/15 px-4 py-2 text-sm font-black text-[#ffb4b4]">
                    Pitanje završeno
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-[#778DA9]/25 bg-[#778DA9]/10 px-4 py-2 text-sm font-black text-[#B8C4D6]">
                    U tijeku
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-5 text-center sm:p-8`}>
            <span className="inline-flex rounded-full bg-[#415A77]/35 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#E0E1DD]">
              {question.category}
            </span>

            <h1 className="mx-auto mt-6 max-w-3xl text-2xl font-black leading-tight tracking-tight sm:text-4xl">
              {question.question}
            </h1>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {question.options.map((option, index) => (
              <button
                key={option}
                onClick={() => submitAnswer(option)}
                disabled={hasAnswered || questionEnded}
                className="group flex items-center gap-4 rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 p-5 text-left font-black text-[#E0E1DD] shadow-[0_14px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-[#778DA9]/45 hover:bg-[#243551] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0D1B2A] text-sm font-black text-[#B8C4D6] transition group-hover:bg-[#415A77] group-hover:text-white">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </button>
            ))}
          </div>

          {answerResult && (
            <div
              className={`mt-6 rounded-2xl border p-4 text-center font-black ${
                answerResult.isCorrect
                  ? 'border-[#388E3C]/35 bg-[#388E3C]/15 text-[#75d27a]'
                  : 'border-[#C62828]/35 bg-[#C62828]/15 text-[#ffb4b4]'
              }`}
            >
              {answerResult.isCorrect
                ? `Točan odgovor! +${answerResult.pointsEarned} bodova`
                : `Netočno! Točan odgovor je: ${answerResult.correctAnswer}`}
            </div>
          )}

          {shouldShowLeaderboard && leaderboard.length > 0 && (
            <div className={`${cardClass} mt-8 p-5 sm:p-6`}>
              <h2 className="mb-5 text-2xl font-black">Room Leaderboard</h2>

              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#415A77]/35 font-black">
                        {index + 1}
                      </span>

                      <Image
                        src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                        width={48}
                        height={48}
                        className="h-11 w-11 rounded-full ring-2 ring-[#778DA9]/25"
                        alt={`${player.nickname} avatar`}
                        unoptimized
                      />

                      <div className="min-w-0">
                        <p className="truncate font-black">{player.nickname}</p>
                        <p className="text-sm text-[#778DA9]">
                          #{index + 1} mjesto
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black">{player.score}</p>
                      <p className="text-xs text-[#778DA9]">bodova</p>
                    </div>
                  </div>
                ))}
              </div>

              {isHost && (
                <button
                  onClick={nextQuestion}
                  className={`${primaryButtonClass} mt-6 w-full`}
                >
                  {isLastQuestion ? 'Pogledaj rezultate' : 'Sljedeće pitanje'}
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
      <main className={`${shellClass} flex items-center justify-center p-6`}>
        <div className={`${cardClass} w-full max-w-md p-8 text-center`}>
          <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-[#415A77]/50" />
          <h1 className="text-3xl font-black">Učitavanje sobe...</h1>

          {errorMessage && (
            <p className="mt-5 rounded-2xl border border-[#C62828]/35 bg-[#C62828]/15 p-4 font-bold text-[#ffb4b4]">
              {errorMessage}
            </p>
          )}

          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl border border-[#778DA9]/20 px-5 py-3 font-bold transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
          >
            ← Nazad
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`${shellClass} p-4 sm:p-6 lg:p-8`}>
      <div className="mx-auto max-w-7xl">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-[#C62828]/35 bg-[#C62828]/15 p-4 text-center font-bold text-[#ffb4b4]">
            {errorMessage}
          </div>
        )}

        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#778DA9]/15 pb-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Room Lobby
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Soba
              </h1>
              <span className="rounded-full border border-[#778DA9]/20 bg-[#1B263B] px-4 py-2 font-mono text-sm font-black tracking-widest text-[#B8C4D6]">
                {room.code}
              </span>
            </div>
            <p className="mt-3 text-[#B8C4D6]">
              {isHost ? 'Ti si host sobe' : 'Čekaš da host pokrene igru'}
            </p>
          </div>

          <button onClick={leaveRoom} className={dangerButtonClass}>
            Napusti sobu
          </button>
        </header>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black">
                  Igrači ({room.players.length}/8)
                </h2>
                <span className="rounded-full bg-[#415A77]/25 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#B8C4D6]">
                  {room.players.filter((player) => player.isReady).length} ready
                </span>
              </div>

              <div className="space-y-3">
                {room.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative shrink-0">
                        <Image
                          src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full ring-2 ring-[#778DA9]/25"
                          alt={`${player.nickname} avatar`}
                          unoptimized
                        />
                        <span
                          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0D1B2A] ${
                            player.connected === false
                              ? 'bg-[#C62828]'
                              : 'bg-[#388E3C]'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-black">
                            {player.nickname}
                          </p>
                          {player.id === room.hostId && (
                            <span className="rounded-full bg-[#778DA9]/15 px-2.5 py-1 text-xs font-black text-[#B8C4D6]">
                              Host
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-[#778DA9]">
                          {player.connected === false ? 'Offline' : 'Online'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          player.isReady
                            ? 'bg-[#388E3C]/20 text-[#75d27a]'
                            : 'bg-[#778DA9]/12 text-[#B8C4D6]'
                        }`}
                      >
                        {player.isReady ? 'Ready' : 'Not ready'}
                      </span>

                      {isHost &&
                        player.id !== room.hostId &&
                        player.id !== currentPlayer?.id && (
                          <button
                            type="button"
                            onClick={() => kickPlayer(player.id)}
                            className="rounded-full border border-[#C62828]/30 bg-[#C62828]/15 px-3 py-1 text-xs font-black text-[#ffb4b4] transition hover:bg-[#C62828] hover:text-white"
                          >
                            Izbaci
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
              
                {!isHost && (
              <button
                onClick={toggleReady}
  className={`mt-6 w-full rounded-2xl px-5 py-3 font-bold text-white transition ${
    currentPlayer?.isReady
      ? 'bg-[#C62828] hover:bg-[#b71c1c]'
      : 'bg-[#388E3C] hover:bg-[#2e7d32]'
  }`}
              >
                {currentPlayer?.isReady ? 'Makni ready' : 'Ready'}
              </button>)}
            </section>

            {friends.length > 0 && (
              <section className={`${cardClass} p-5 sm:p-6`}>
                <h2 className="mb-4 text-2xl font-black">
                  Pozovi prijatelje
                </h2>

                <div className="grid gap-3">
                  {friends.map((friend) => {
                    const friendData = getFriendData(friend);

                    return (
                      <button
  key={friendData.id}
  onClick={() => inviteFriend(friendData.id)}
  disabled={invitingFriendId === friendData.id}
  className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
>
  <p className="font-black">{friendData.username}</p>
  <p className="text-sm text-[#778DA9]">
    {invitingFriendId === friendData.id
      ? 'Šaljem pozivnicu...'
      : 'Pošalji pozivnicu'}
  </p>
</button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-6 text-2xl font-black">Postavke igre</h2>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Kategorija
                  </label>

                  <select
                    value={selectedCategory}
                    onChange={(e) => changeCategory(e.target.value)}
                    disabled={!isHost || room.started}
                    className={inputClass}
                  >
                    <option value="All">Sve kategorije</option>
                    <option value="Sport">Sport</option>
                    <option value="Geografija">Geografija</option>
                    <option value="Računarstvo">Računarstvo</option>
                    <option value="Povijest">Povijest</option>
                    <option value="Znanost">Znanost</option>
                    <option value="Književnost">Književnost</option>
                    <option value="Umjetnost">Umjetnost</option>
                    <option value="Glazba">Glazba</option>
                    <option value="Videoigre">Videoigre</option>
                    <option value="Trendovi i aktualnosti">
                      Trendovi i aktualnosti
                    </option>
                    <option value="Poslovanje i brendovi">
                      Poslovanje i brendovi
                    </option>
                    <option value="Životinje">Životinje</option>
                    <option value="Ljudsko tijelo i zdravlje">
                      Ljudsko tijelo i zdravlje
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Broj pitanja
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    disabled={!isHost || room.started}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Vrijeme po pitanju
                  </label>

                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={timePerQuestion}
                    onChange={(e) =>
                      setTimePerQuestion(Number(e.target.value))
                    }
                    disabled={!isHost || room.started}
                    className={inputClass}
                  />
                </div>

                <div>
  <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
    Težina
  </label>

  <select
    value={selectedDifficulty}
    onChange={(e) => changeDifficulty(e.target.value)}
    disabled={!isHost || room.started}
    className={inputClass}
  >
    <option value="All">Sve težine</option>
    <option value="easy">Easy</option>
    <option value="medium">Medium</option>
    <option value="hard">Hard</option>
  </select>
</div>
              </div>

              {isHost && (
                <button
                  onClick={startGame}
                  className={`${successButtonClass} mt-6 w-full`}
                >
                  Pokreni igru
                </button>
              )}
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black">Chat</h2>
                <span className="rounded-full bg-[#415A77]/25 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#B8C4D6]">
                  Live room
                </span>
              </div>

              <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4">
                {chatMessages.length === 0 ? (
                  <p className="text-[#778DA9]">Još nema poruka.</p>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={`${message.createdAt}-${index}`}
                      className="rounded-2xl bg-[#1B263B]/75 p-3"
                    >
                      <p className="mb-1 text-sm font-black text-[#B8C4D6]">
                        {message.nickname}
                      </p>
                      <p className="text-[#E0E1DD]">{message.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  className={inputClass}
                  placeholder="Napiši poruku..."
                />

                <button
                  onClick={sendMessage}
                  className={`${primaryButtonClass} sm:w-auto`}
                >
                  Pošalji
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
      {toast && (
  <div
    className={`fixed bottom-5 right-5 z-50 rounded-2xl border px-5 py-3 font-bold shadow-xl backdrop-blur ${
      toastType === 'success'
        ? 'border-[#388E3C]/30 bg-[#388E3C]/15 text-[#75d27a]'
        : 'border-[#C62828]/30 bg-[#C62828]/15 text-[#ffb4b4]'
    }`}
  >
    {toast}
  </div>
)}
    </main>
  );
}