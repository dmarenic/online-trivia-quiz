'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../src/lib/api';
import Link from 'next/link';

type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  targetScore: number;
  rewardXp: number;
  date: string;
};

type DailyStatus = {
  played: boolean;
  completed?: boolean;
};

export default function DailyPage() {
  const [played, setPlayed] = useState(false);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDailyChallenge() {
      try {
        const currentChallenge =
          await apiFetch<DailyChallenge>('/daily-challenge');

        setChallenge(currentChallenge);

        const token = localStorage.getItem('token');

        if (token) {
          const status = await apiFetch<DailyStatus>(
            '/daily-challenge/status/me',
          );

          setPlayed(status.played);
        }
      } catch (error) {
        console.error(error);
        setMessage('Greška kod učitavanja daily challengea.');
      } finally {
        setLoading(false);
      }
    }

    loadDailyChallenge();
  }, []);

  function startDailyChallenge() {
    const token = localStorage.getItem('token');

    if (!token) {
      setMessage('Moraš biti prijavljen za Daily Challenge.');
      return;
    }

    window.location.href = '/daily/play';
  }

  return (
    <main className="min-h-screen bg-[#f6f9fd] p-8 text-[#233350]">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#b0c9d4]/60 bg-white/85 p-8 shadow-xl backdrop-blur">
        <Link href="/">← Nazad</Link>

        <h1 className="mb-6 text-center text-4xl font-extrabold">
          🏅 Daily Challenge
        </h1>

        {loading ? (
          <p className="text-center text-[#7ca5b8]">Učitavanje...</p>
        ) : !challenge ? (
          <p className="text-center font-semibold text-red-500">
            Daily Challenge trenutno nije dostupan.
          </p>
        ) : (
          <div className="rounded-3xl border border-[#b0c9d4]/50 bg-[#f6f9fd] p-6 text-center shadow-inner">
            <h2 className="mb-3 text-2xl font-bold">{challenge.title}</h2>

            <p className="mb-4 text-[#2f2f2f]/75">{challenge.description}</p>

            <p className="mb-2">
              Cilj: <b>{challenge.targetScore}</b> bodova
            </p>

            <p className="mb-2">
              Nagrada: <b>{challenge.rewardXp}</b> XP
            </p>

            {played ? (
              <p className="mt-4 rounded-2xl bg-[#a8d8b9] p-3 font-bold text-[#233350]">
                ✅ Daily Challenge si već igrao danas
              </p>
            ) : (
              <button
                type="button"
                onClick={startDailyChallenge}
                className="mt-4 w-full rounded-2xl bg-[#7ca5b8] p-3 font-bold text-white shadow-md transition hover:bg-[#5f8fa6] hover:shadow-lg"
              >
                ▶️ Start Daily Challenge
              </button>
            )}

            {message && <p className="mt-4 text-lg font-semibold">{message}</p>}
          </div>
        )}
      </div>
    </main>
  );
}