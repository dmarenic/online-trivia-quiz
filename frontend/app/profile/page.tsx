"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  xp?: number;
  level?: number;
  dailyStreak?: number;
  lastDailyDate?: string;
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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [avatarInput, setAvatarInput] = useState("");
  const [dailyResults, setDailyResults] = useState<GameResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [roomInvites, setRoomInvites] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser: User = JSON.parse(savedUser);

    setUser(parsedUser);
    setAvatarInput(parsedUser.avatar || parsedUser.username);

fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${parsedUser.id}/room-invites`)
  .then((res) => res.json())
  .then((data) => setRoomInvites(data));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${parsedUser.id}/stats`)
  .then((res) => res.json())
  .then((data) => setStats(data));
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${parsedUser.id}/daily-results`)
  .then((res) => res.json())
  .then((data) => {
    if (Array.isArray(data)) {
      setDailyResults(data);
    } else {
      setDailyResults([]);
    }
  });
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${parsedUser.id}/results`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
        setAchievements(data.achievements || []);
      });
  }, []);

  async function updateAvatar() {
    if (!user || !avatarInput.trim()) return;
    

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/avatar`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar: avatarInput,
        }),
      },
    );
    

    const updatedUser = await res.json();

    if (!res.ok) {
      alert("Greška kod spremanja avatara.");
      return;
    }

    const newUser = {
      ...user,
      avatar: updatedUser.avatar,
    };

    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  }

  const bestScore =
    results.length > 0 ? Math.max(...results.map((r) => r.score)) : 0;

  const xp = user?.xp || 0;
const level = user?.level || 1;
const xpForCurrentLevel = (level - 1) * 1000;
const xpProgress = xp - xpForCurrentLevel;
const progressPercent = Math.min((xpProgress / 1000) * 100, 100);

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <a href="/" className="mb-6 block text-blue-400 hover:underline">
          ← Nazad na igru
        </a>

        <h1 className="mb-6 text-center text-4xl font-bold">Profil</h1>

        {user && (
          <div className="mb-8 rounded-xl bg-zinc-700 p-6 text-center">
            <img
              src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${
                user.avatar || user.username
              }`}
              className="mx-auto mb-4 h-32 w-32 rounded-full bg-zinc-800"
              alt="Avatar"
            />

            <p>
              <b>Username:</b> {user.username}
            </p>

            <p className="mb-4">
              <b>Email:</b> {user.email}
            </p>

            <div className="mt-4 rounded-xl bg-zinc-800 p-4">
  <p className="mb-2 text-xl font-bold">
    ⭐ Level {level}
  </p>

  <div className="mb-2 h-4 w-full rounded-full bg-zinc-700">
    <div
      className="h-4 rounded-full bg-yellow-500"
      style={{
        width: `${progressPercent}%`,
      }}
    />
  </div>

  <p className="text-sm text-zinc-400">
    {xpProgress} / 1000 XP
  </p>
</div>

            <div className="mt-4 rounded-lg bg-zinc-800 p-4">
              <p className="text-xl font-bold">
                ⭐ Level {user.level || 1}
              </p>

              <p className="text-zinc-300">
                XP: {user.xp || 0}
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-orange-600 p-4 text-center">
  <p className="text-xl font-bold">
    🔥 Daily Streak
  </p>

  <p className="text-3xl font-bold">
    {user.dailyStreak || 0} dana
  </p>
</div>

            <div className="flex gap-2">
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

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-zinc-700 p-4 text-center">
            <p className="text-sm text-zinc-400">Najbolji score</p>
            <p className="text-3xl font-bold">{bestScore}</p>
          </div>

          <div className="rounded-xl bg-zinc-700 p-4 text-center">
            <p className="text-sm text-zinc-400">Broj igara</p>
            <p className="text-3xl font-bold">{results.length}</p>
          </div>
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
          <span>{new Date(result.createdAt).toLocaleDateString()}</span>
          <b>{result.score} bodova</b>
        </div>
      ))}
    </div>
  )}
</div>
<a
  href="/achievements"
  className="mb-6 block rounded-lg bg-yellow-500 p-3 text-center font-bold text-black hover:bg-yellow-400"
>
  🏆 Pogledaj sve achievemente
</a>

{roomInvites.length > 0 && (
  <div className="mt-8 rounded-xl bg-zinc-700 p-6">
    <h2 className="mb-4 text-2xl font-bold">📨 Pozivnice u sobe</h2>

    <div className="space-y-3">
      {roomInvites.map((invite) => (
        <div
          key={invite.id}
          className="rounded-lg bg-zinc-800 p-4"
        >
          <p className="mb-3">
            <strong>{invite.fromUser.username}</strong> te poziva u sobu{' '}
            <strong>{invite.roomCode}</strong>
          </p>

          <a
            href={`/?room=${invite.roomCode}`}
            className="block rounded-lg bg-blue-600 p-3 text-center font-bold hover:bg-blue-700"
          >
            Pridruži se sobi
          </a>
        </div>
      ))}
    </div>
  </div>
)}

{stats && (
  <div className="mt-8 rounded-xl bg-zinc-700 p-6">
    <h2 className="mb-4 text-2xl font-bold">📊 Statistika</h2>

    <p>Odigrane igre: {stats.totalGames}</p>
    <p>Najbolji rezultat: {stats.highestScore}</p>
    <p>Prosječni rezultat: {stats.averageScore}</p>
    <p>Ukupni bodovi: {stats.totalScore}</p>
    <p>Broj pobjeda: {stats.wins}</p>
  </div>
)}

{stats?.recentGames?.length > 0 && (
  <div className="mt-8 rounded-xl bg-zinc-700 p-6">
    <h2 className="mb-4 text-2xl font-bold">🎮 Zadnje igre</h2>

    <div className="space-y-3">
      {stats.recentGames.map((game: any) => (
        <div
          key={game.id}
          className="flex justify-between rounded-lg bg-zinc-800 p-4"
        >
          <span>{new Date(game.createdAt).toLocaleDateString('hr-HR')}</span>
          <span className="font-bold">{game.score} bodova</span>
        </div>
      ))}
    </div>
  </div>
)}

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">🏆 Achievements</h2>

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