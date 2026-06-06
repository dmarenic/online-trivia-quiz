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

  const chartData = results
    .slice()
    .reverse()
    .slice(-10)
    .map((result, index) => ({
      name: `Igra ${index + 1}`,
      score: result.score,
    }));

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-4xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <Link href="/">← Nazad</Link>

        <h1 className="mb-6 text-center text-4xl font-bold">Profil</h1>

        {user && (
          <div className="mb-8 rounded-xl bg-zinc-700 p-6 text-center">
            <Image
  src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${
    user.avatar || user.username
  }`}
  alt="Avatar"
  width={128}
  height={128}
  className="mx-auto mb-4 h-32 w-32 rounded-full bg-zinc-800"
  unoptimized
/>

            <p>
              <b>Username:</b> {user.username}
            </p>

            <p className="mb-4">
              <b>Email:</b> {user.email}
            </p>

            <div className="mt-4 rounded-xl bg-zinc-800 p-4">
              <p className="mb-2 text-xl font-bold">⭐ Level {level}</p>

              <div className="mb-2 h-4 w-full rounded-full bg-zinc-700">
                <div
                  className="h-4 rounded-full bg-yellow-500"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>

              <p className="text-sm text-zinc-400">{xpProgress} / 1000 XP</p>
            </div>

            <div className="mt-4 rounded-xl bg-orange-600 p-4 text-center">
              <p className="text-xl font-bold">🔥 Daily Streak</p>
              <p className="text-3xl font-bold">
                {user.dailyStreak || 0} dana
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                className="w-full rounded-lg p-3 text-black"
                placeholder="Avatar seed"
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
              />

              <button
                onClick={updateAvatar}
                className="rounded-lg bg-blue-600 px-4 font-bold hover:bg-blue-700"
              >
                Spremi
              </button>
            </div>
          </div>
        )}

        {stats && (
          <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-zinc-700 p-5 text-center shadow">
              <p className="text-sm text-zinc-400">Ukupno igara</p>
              <p className="text-3xl font-bold">{stats.totalGames}</p>
            </div>

            <div className="rounded-2xl bg-zinc-700 p-5 text-center shadow">
              <p className="text-sm text-zinc-400">Najbolji rezultat</p>
              <p className="text-3xl font-bold">{stats.bestScore}</p>
            </div>

            <div className="rounded-2xl bg-zinc-700 p-5 text-center shadow">
              <p className="text-sm text-zinc-400">Prosječan score</p>
              <p className="text-3xl font-bold">{stats.averageScore}</p>
            </div>

            <div className="rounded-2xl bg-zinc-700 p-5 text-center shadow">
              <p className="text-sm text-zinc-400">Točnost</p>
              <p className="text-3xl font-bold">{stats.accuracy}%</p>
            </div>

            <div className="rounded-2xl bg-zinc-700 p-5 text-center shadow">
              <p className="text-sm text-zinc-400">Ukupni XP</p>
              <p className="text-3xl font-bold">{stats.totalXp}</p>
            </div>

            <div className="rounded-2xl bg-zinc-700 p-5 text-center shadow">
              <p className="text-sm text-zinc-400">Achievementi</p>
              <p className="text-3xl font-bold">{stats.achievementCount}</p>
            </div>
          </section>
        )}

        {chartData.length > 0 && (
          <div className="mt-10 rounded-2xl bg-zinc-700 p-6">
            <h2 className="mb-4 text-2xl font-bold">📊 Zadnjih 10 rezultata</h2>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">📜 Match History</h2>

          {matchHistory.length === 0 ? (
            <p className="text-zinc-400">Još nema odigranih mečeva.</p>
          ) : (
            <div className="space-y-3">
              {matchHistory.map((match) => (
                <div key={match.id} className="rounded-xl bg-zinc-700 p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">
                        {new Date(match.createdAt).toLocaleDateString('hr-HR')}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Mode: {match.mode}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold">{match.score} bodova</p>
                      <p className="text-sm text-zinc-400">
                        Točnost: {match.accuracy}%
                      </p>
                      <p className="text-sm text-zinc-400">
                        {match.correctAnswers}/{match.totalQuestions} točno
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {roomInvites.length > 0 && (
          <div className="mt-8 rounded-xl bg-zinc-700 p-6">
            <h2 className="mb-4 text-2xl font-bold">📨 Pozivnice u sobe</h2>

            <div className="space-y-3">
              {roomInvites.map((invite) => (
                <div key={invite.id} className="rounded-lg bg-zinc-800 p-4">
                  <p className="mb-3">
                    <strong>{invite.fromUser.username}</strong> te poziva u
                    sobu <strong>{invite.roomCode}</strong>
                  </p>

                  <div className="flex gap-3">
                    <a
                      href={`/?room=${invite.roomCode}`}
                      className="flex-1 rounded-lg bg-blue-600 p-3 text-center font-bold hover:bg-blue-700"
                    >
                      Pridruži se sobi
                    </a>

                    <button
                      onClick={() => deleteInvite(invite.id)}
                      className="rounded-lg bg-red-600 px-4 font-bold hover:bg-red-700"
                    >
                      Obriši
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">🎮 Zadnje igre</h2>

          {results.length === 0 ? (
            <p className="text-zinc-400">Još nema odigranih igara.</p>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex justify-between rounded-lg bg-zinc-700 p-4"
                >
                  <span>
                    {new Date(result.createdAt).toLocaleDateString('hr-HR')}
                  </span>
                  <b>{result.score} bodova</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">🏅 Daily History</h2>

          {dailyResults.length === 0 ? (
            <p className="text-zinc-400">Još nema daily rezultata.</p>
          ) : (
            <div className="space-y-3">
              {dailyResults.map((result) => (
                <div
                  key={result.id}
                  className="flex justify-between rounded-lg bg-zinc-700 p-4"
                >
                  <span>
                    {new Date(result.createdAt).toLocaleDateString('hr-HR')}
                  </span>
                  <b>{result.score} bodova</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <a
          href="/achievements"
          className="mt-8 block rounded-lg bg-yellow-500 p-3 text-center font-bold text-black hover:bg-yellow-400"
        >
          🏆 Pogledaj sve achievemente
        </a>

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">🏆 Achievementi</h2>

          {achievements.length === 0 ? (
            <p className="text-zinc-400">Još nema postignuća.</p>
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-lg bg-yellow-600 p-4 text-black"
                >
                  <p className="font-bold">{achievement.title}</p>
                  <p>{achievement.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}