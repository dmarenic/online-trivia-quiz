"use client";

import { useEffect, useState } from "react";

type Achievement = {
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(savedUser);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/achievements`)
      .then((res) => res.json())
      .then((data) => setAchievements(data));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <a href="/" className="mb-6 block text-blue-400 hover:underline">
          ← Nazad na igru
        </a>

        <h1 className="mb-8 text-center text-4xl font-bold">
          🏆 Achievements
        </h1>

        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.title}
              className={`rounded-xl p-4 ${
                achievement.unlocked
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-700 text-zinc-300"
              }`}
            >
              <h2 className="text-xl font-bold">
                {achievement.unlocked ? "✅" : "🔒"} {achievement.title}
              </h2>

              <p>{achievement.description}</p>

              {achievement.unlockedAt && (
                <p className="mt-2 text-sm">
                  Otključano:{" "}
                  {new Date(achievement.unlockedAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}