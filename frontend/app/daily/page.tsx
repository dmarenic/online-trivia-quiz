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

const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const successButtonClass =
  'rounded-2xl bg-[#388E3C] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

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
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-7xl flex-col">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#778DA9]/15 pb-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Daily Arena
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Daily Challenge
            </h1>

            <p className="mt-3 max-w-2xl text-[#B8C4D6]">
              Jedan dnevni izazov, jedan pokušaj i jasna XP nagrada za
              ostvareni cilj.
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-[#778DA9]/20 px-5 py-3 font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
            >
              ← Nazad
            </Link>

            <Link
              href="/daily/leaderboard"
              className={primaryButtonClass}
            >
              Daily Leaderboard
            </Link>

            <Link href="/profile" className={primaryButtonClass}>
              Moj profil
            </Link>
          </nav>
        </header>

        {loading ? (
          <section className={`${cardClass} p-8 text-center sm:p-12`}>
            <div className="mx-auto mb-5 h-14 w-14 animate-pulse rounded-2xl bg-[#415A77]/35" />
            <h2 className="text-3xl font-black">
              Učitavanje daily challengea...
            </h2>
            <p className="mt-3 text-[#B8C4D6]">
              Dohvaćam današnji izazov i tvoj status.
            </p>
          </section>
        ) : !challenge ? (
          <section className="rounded-[20px] border border-[#C62828]/35 bg-[#C62828]/15 p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <h2 className="text-3xl font-black text-[#ffb4b4]">
              Daily Challenge nije dostupan
            </h2>
            <p className="mt-3 font-bold text-[#ffb4b4]">
              {message || 'Pokušaj ponovno kasnije.'}
            </p>
          </section>
        ) : (
          <section className="grid flex-1 items-center gap-8 lg:grid-cols-[1fr_460px]">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#B8C4D6]">
                {new Date(challenge.date).toLocaleDateString('hr-HR')}
              </p>

              <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                {challenge.title}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#B8C4D6]">
                {challenge.description}
              </p>

              <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
                <div className={`${cardClass} p-5`}>
                  <p className="text-sm font-bold text-[#778DA9]">Cilj</p>
                  <p className="mt-2 text-3xl font-black">
                    {challenge.targetScore}
                  </p>
                  <p className="text-sm text-[#778DA9]">bodova</p>
                </div>

                <div className={`${cardClass} p-5`}>
                  <p className="text-sm font-bold text-[#778DA9]">Nagrada</p>
                  <p className="mt-2 text-3xl font-black">
                    {challenge.rewardXp}
                  </p>
                  <p className="text-sm text-[#778DA9]">XP</p>
                </div>

                <div className={`${cardClass} p-5`}>
                  <p className="text-sm font-bold text-[#778DA9]">Status</p>
                  <p className="mt-2 text-3xl font-black">
                    {played ? 'Played' : 'Open'}
                  </p>
                  <p className="text-sm text-[#778DA9]">
                    {played ? 'danas završeno' : 'spremno za igru'}
                  </p>
                </div>
              </div>
            </div>

            <aside className={`${cardClass} p-5 text-center sm:p-7`}>
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#415A77]/25 text-3xl">
                🏅
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                Today&apos;s mission
              </p>

              <h3 className="mt-2 text-3xl font-black">Spreman za izazov?</h3>

              <p className="mt-3 text-[#B8C4D6]">
                Daily Challenge možeš igrati jednom dnevno. Ostvari ciljni score
                i osvoji XP nagradu.
              </p>

              {played ? (
                <div className="mt-6 rounded-2xl border border-[#388E3C]/35 bg-[#388E3C]/15 p-4 font-bold text-[#75d27a]">
                  Daily Challenge si već igrao danas.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startDailyChallenge}
                  className={`${successButtonClass} mt-6 w-full`}
                >
                  Start Daily Challenge
                </button>
              )}

              {message && (
                <p className="mt-5 rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/55 p-4 font-bold text-[#B8C4D6]">
                  {message}
                </p>
              )}
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}