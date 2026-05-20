'use client';

import { useEffect, useState } from 'react';

type GameResult = {
  id: string;
  nickname: string;
  score: number;
  createdAt: string;
};

export default function LeaderboardPage() {
  const [results, setResults] = useState<GameResult[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/leaderboard')
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <h1 className="mb-8 text-center text-4xl font-bold">
          Global Leaderboard
        </h1>

        <a
  href="/"
  className="mb-6 block text-center text-sm text-blue-400 hover:underline"
>
  ← Nazad na igru
</a>

        {results.length === 0 ? (
          <p className="text-center text-zinc-400">Još nema rezultata.</p>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="flex items-center justify-between rounded-lg bg-zinc-700 p-4"
              >
                <div>
                  <p className="font-bold">
                    {index + 1}. {result.nickname}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {new Date(result.createdAt).toLocaleString()}
                  </p>
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