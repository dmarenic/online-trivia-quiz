'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  xp?: number;
  level?: number;
  dailyStreak?: number;
};

type UserStats = {
  totalGames: number;
  bestScore: number;
  averageScore: number;
  accuracy: number;
  totalXp: number;
  level: number;
  achievementCount: number;
};

type MatchHistoryItem = {
  id: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  mode: string;
  createdAt: string;
};

type GameResult = {
  id: string;
  nickname: string;
  score: number;
  createdAt: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

type RoomInvite = {
  id: string;
  roomCode: string;
  fromUser: {
    username: string;
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
  'w-full rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/70 px-4 py-3 text-[#E0E1DD] outline-none transition placeholder:text-[#778DA9] focus:border-[#778DA9]/55 focus:ring-4 focus:ring-[#778DA9]/10';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const successButtonClass =
  'rounded-2xl bg-[#388E3C] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const dangerButtonClass =
  'rounded-2xl bg-[#C62828] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D32F2F] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [dailyResults, setDailyResults] = useState<GameResult[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [roomInvites, setRoomInvites] = useState<RoomInvite[]>([]);
  const [avatarInput, setAvatarInput] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!savedUser || !token) {
        window.location.href = '/login';
        return;
      }

      const parsedUser: User = JSON.parse(savedUser);

      setUser(parsedUser);
      setAvatarInput(parsedUser.avatar || parsedUser.username);

      try {
        const statsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/stats`,
          { headers: getAuthHeaders() },
        );
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err) {
        console.error('Greška kod statistike:', err);
      }

      try {
        const historyRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/match-history`,
          { headers: getAuthHeaders() },
        );
        const historyData = await historyRes.json();
        setMatchHistory(Array.isArray(historyData) ? historyData : []);
      } catch (err) {
        console.error('Greška kod match history:', err);
      }

      try {
        const resultsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/results`,
          { headers: getAuthHeaders() },
        );
        const resultsData = await resultsRes.json();

        setResults(resultsData.results || []);
        setAchievements(resultsData.achievements || []);

        setDailyResults(
          Array.isArray(resultsData.results)
            ? resultsData.results.filter(
                (result: GameResult & { mode?: string }) =>
                  result.mode === 'daily',
              )
            : [],
        );
      } catch (err) {
        console.error('Greška kod rezultata:', err);
      }

      try {
        const invitesRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/room-invites`,
          { headers: getAuthHeaders() },
        );
        const invitesData = await invitesRes.json();
        setRoomInvites(Array.isArray(invitesData) ? invitesData : []);
      } catch (err) {
        console.error('Greška kod pozivnica:', err);
      }
    }

    loadProfile();
  }, []);

  async function updateAvatar() {
    if (!user || !avatarInput.trim()) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/avatar`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          avatar: avatarInput,
        }),
      },
    );

    if (!res.ok) {
      alert('Greška kod spremanja avatara.');
      return;
    }

    const updatedUser = await res.json();

    const newUser = {
      ...user,
      avatar: updatedUser.avatar,
    };

    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  async function deleteInvite(inviteId: string) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/room-invites/${inviteId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      },
    );

    if (!res.ok) {
      alert('Greška kod brisanja pozivnice.');
      return;
    }

    setRoomInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
  }

  const xp = stats?.totalXp ?? user?.xp ?? 0;
  const level = stats?.level ?? user?.level ?? 1;
  const xpForCurrentLevel = (level - 1) * 1000;
  const xpProgress = xp - xpForCurrentLevel;
  const progressPercent = Math.min((xpProgress / 1000) * 100, 100);
  const avatarSeed = encodeURIComponent(
  (user?.avatar || user?.username || "Player").trim()
);
  const chartData = results
    .slice()
    .reverse()
    .slice(-10)
    .map((result, index) => ({
      name: `Igra ${index + 1}`,
      score: result.score,
    }));
    

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 rounded-[20px] border border-[#778DA9]/15 bg-[#1B263B]/55 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:px-6">
          <Link
            href="/"
            className="rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
          >
            ← Nazad
          </Link>

          <nav className="flex flex-wrap gap-3">

            <Link
              href="/achievements"
              className={primaryButtonClass}
            >
              Achievementi
            </Link>
          </nav>
        </header>

        {user && (
          <section className={`${cardClass} mb-6 overflow-hidden`}>
            <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
              <div className="border-b border-[#778DA9]/15 bg-[#0D1B2A]/35 p-6 text-center lg:border-b-0 lg:border-r">
            

                <Image
  src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${avatarSeed}`}
  alt={user.username}
  width={128}
  height={128}
  className="mx-auto mb-4 h-32 w-32 rounded-full bg-[#0D1B2A] ring-4 ring-[#778DA9]/20"
  unoptimized
/>

                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                  Player Profile
                </p>
                <h1 className="mt-2 truncate text-4xl font-black tracking-tight">
                  {user.username}
                </h1>
                <p className="mt-2 truncate text-[#B8C4D6]">{user.email}</p>

                <div className="mt-6 rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/70 p-4">
                  <p className="text-sm font-bold text-[#B8C4D6]">Daily Streak</p>
                  <p className="mt-1 text-4xl font-black">
                    {user.dailyStreak || 0}
                    <span className="ml-2 text-base text-[#778DA9]">dana</span>
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                    Level Progress
                  </p>

                  <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <h2 className="text-4xl font-black">Level {level}</h2>
                      <p className="mt-1 text-[#B8C4D6]">
                        {xpProgress} / 1000 XP do sljedećeg levela
                      </p>
                    </div>

                    <p className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 font-black text-[#E0E1DD]">
                      {xp} XP ukupno
                    </p>
                  </div>

                  <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-[#0D1B2A]/80">
                    <div
                      className="h-full rounded-full bg-[#388E3C] transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className={inputClass}
                    placeholder="Avatar seed"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                  />

                  <button onClick={updateAvatar} className={successButtonClass}>
                    Spremi avatar
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {stats && (
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ['Ukupno igara', stats.totalGames],
              ['Najbolji rezultat', stats.bestScore],
              ['Prosječan score', stats.averageScore],
              ['Točnost', `${stats.accuracy}%`],
              ['Ukupni XP', stats.totalXp],
              ['Achievementi', stats.achievementCount],
            ].map(([label, value]) => (
              <div key={label} className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
            ))}
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {chartData.length > 0 && (
              <section className={`${cardClass} p-5 sm:p-6`}>
                <h2 className="mb-5 text-2xl font-black">
                  Zadnjih 10 rezultata
                </h2>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="rgba(119,141,169,0.18)" />
                      <XAxis
                        dataKey="name"
                        stroke="#778DA9"
                        tick={{ fill: '#B8C4D6', fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#778DA9"
                        tick={{ fill: '#B8C4D6', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1B263B',
                          border: '1px solid rgba(119,141,169,0.25)',
                          borderRadius: 16,
                          color: '#E0E1DD',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#778DA9"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-5 text-2xl font-black">Match History</h2>

              {matchHistory.length === 0 ? (
                <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                  Još nema odigranih mečeva.
                </p>
              ) : (
                <div className="space-y-3">
                  {matchHistory.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-black">
                          {new Date(match.createdAt).toLocaleDateString('hr-HR')}
                        </p>
                        <p className="mt-1 text-sm text-[#778DA9]">
                          Mode: {match.mode}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-left sm:text-right">
                        <div>
                          <p className="text-sm text-[#778DA9]">Score</p>
                          <p className="font-black">{match.score}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#778DA9]">Točnost</p>
                          <p className="font-black">{match.accuracy}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#778DA9]">Točno</p>
                          <p className="font-black">
                            {match.correctAnswers}/{match.totalQuestions}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-5 text-2xl font-black">Zadnje igre</h2>

              {results.length === 0 ? (
                <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                  Još nema odigranih igara.
                </p>
              ) : (
                <div className="space-y-3">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="flex justify-between rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4"
                    >
                      <span>
                        {new Date(result.createdAt).toLocaleDateString('hr-HR')}
                      </span>
                      <b>{result.score} bodova</b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            {roomInvites.length > 0 && (
              <section className={`${cardClass} p-5 sm:p-6`}>
                <h2 className="mb-5 text-2xl font-black">Pozivnice u sobe</h2>

                <div className="space-y-3">
                  {roomInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4"
                    >
                      <p className="mb-4 text-[#B8C4D6]">
                        <strong className="text-[#E0E1DD]">
                          {invite.fromUser.username}
                        </strong>{' '}
                        te poziva u sobu{' '}
                        <strong className="font-mono text-[#E0E1DD]">
                          {invite.roomCode}
                        </strong>
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <a
                          href={`/?room=${invite.roomCode}`}
                          className={`${successButtonClass} text-center`}
                        >
                          Pridruži se
                        </a>

                        <button
                          onClick={() => deleteInvite(invite.id)}
                          className={dangerButtonClass}
                        >
                          Obriši
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black">Daily History</h2>
                <Link
                  href="/daily"
                  className="rounded-full border border-[#778DA9]/20 px-3 py-1.5 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
                >
                  Daily
                </Link>
              </div>

              {dailyResults.length === 0 ? (
                <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                  Još nema daily rezultata.
                </p>
              ) : (
                <div className="space-y-3">
                  {dailyResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex justify-between rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4"
                    >
                      <span>
                        {new Date(result.createdAt).toLocaleDateString('hr-HR')}
                      </span>
                      <b>{result.score} bodova</b>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black">Achievementi</h2>
                <Link
                  href="/achievements"
                  className="rounded-full border border-[#778DA9]/20 px-3 py-1.5 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
                >
                  Svi
                </Link>
              </div>

              {achievements.length === 0 ? (
                <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                  Još nema postignuća.
                </p>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75"
                    >
                      <p className="font-black">{achievement.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#B8C4D6]">
                        {achievement.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}