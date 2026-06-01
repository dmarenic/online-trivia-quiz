"use client";

import { useEffect, useState } from "react";

type DailyResult = {
  id: string;
  nickname: string;
  score: number;
  createdAt: string;
  user?: {
    username: string;
    avatar?: string;
  };
};

export default function DailyLeaderboardPage() {
  const [results, setResults] = useState<DailyResult[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/leaderboard`)
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <a href="/" className="mb-6 block text-blue-400 hover:underline">
          ← Nazad na igru
        </a>

        <h1 className="mb-8 text-center text-4xl font-bold">
          🏅 Daily Leaderboard
        </h1>

        {results.length === 0 ? (
          <p className="text-center text-zinc-400">
            Još nema daily rezultata.
          </p>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="flex items-center justify-between rounded-lg bg-zinc-700 p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `${index + 1}.`}
                  </span>

                  <img
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${
                      result.user?.avatar || result.nickname
                    }`}
                    className="h-12 w-12 rounded-full bg-zinc-800"
                    alt="Avatar"
                  />

                  <div>
                    <p className="font-bold">
                      {result.user?.username || result.nickname}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {new Date(result.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold">
                  {result.score} bodova
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
