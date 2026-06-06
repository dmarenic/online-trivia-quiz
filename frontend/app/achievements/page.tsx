'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Achievement = {
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

type User = {
  id: string;
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadAchievements() {
      const savedUser = localStorage.getItem('user');

      if (!savedUser) {
        window.location.replace('/login');
        return;
      }

      try {
        const user: User = JSON.parse(savedUser);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/achievements`,
        );

        if (!res.ok) {
          throw new Error('Greška kod dohvaćanja achievementa.');
        }

        const data: Achievement[] = await res.json();
        setAchievements(data);
      } catch (error) {
        console.error(error);
        setMessage('Greška kod učitavanja achievementa.');
      } finally {
        setLoading(false);
      }
    }

    loadAchievements();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <Link href="/" className="mb-6 block text-blue-400 hover:underline">
          ← Nazad
        </Link>

        <h1 className="mb-8 text-center text-4xl font-bold">
          🏆 Achievements
        </h1>

        {loading ? (
          <p className="text-center text-zinc-300">Učitavanje...</p>
        ) : message ? (
          <p className="rounded-xl bg-red-600 p-4 text-center font-bold">
            {message}
          </p>
        ) : achievements.length === 0 ? (
          <p className="text-center text-zinc-300">
            Još nema achievementa.
          </p>
        ) : (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.title}
                className={`rounded-xl p-4 ${
                  achievement.unlocked
                    ? 'bg-yellow-500 text-black'
                    : 'bg-zinc-700 text-zinc-300'
                }`}
              >
                <h2 className="text-xl font-bold">
                  {achievement.unlocked ? '✅' : '🔒'} {achievement.title}
                </h2>

                <p>{achievement.description}</p>

                {achievement.unlockedAt && (
                  <p className="mt-2 text-sm">
                    Otključano:{' '}
                    {new Date(achievement.unlockedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}