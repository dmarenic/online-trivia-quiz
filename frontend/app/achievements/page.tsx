'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Achievement = {
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadAchievements() {
      const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.replace('/login');
      return;
    }

      try {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.replace('/login');
    return;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/achievements`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Achievements error:', res.status, text);
    throw new Error('Greška kod dohvaćanja achievementa.');
  }

  const data = await res.json();

  setAchievements(Array.isArray(data) ? data : []);
} catch (error) {
  console.error(error);
  setMessage('Greška kod učitavanja achievementa.');
} finally {
  setLoading(false);
}}

    loadAchievements();
  }, []);

  const unlockedCount = useMemo(
    () => achievements.filter((achievement) => achievement.unlocked).length,
    [achievements],
  );

  const lockedCount = achievements.length - unlockedCount;

  const progressPercent =
    achievements.length > 0
      ? Math.round((unlockedCount / achievements.length) * 100)
      : 0;

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#778DA9]/15 pb-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Player Progress
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Achievements
            </h1>

            <p className="mt-3 max-w-2xl text-[#B8C4D6]">
              Pregledaj otključana postignuća, napredak profila i ciljeve koji
              još čekaju da ih osvojiš.
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-2xl border border-[#778DA9]/20 px-5 py-3 font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
            >
              ← Nazad
            </Link>

            <Link href="/profile" className={primaryButtonClass}>
              Moj profil
            </Link>
          </nav>
        </header>

        {loading ? (
          <section className={`${cardClass} p-8 text-center sm:p-12`}>
            <div className="mx-auto mb-5 h-14 w-14 animate-pulse rounded-2xl bg-[#415A77]/35" />
            <h2 className="text-3xl font-black">Učitavanje achievementa...</h2>
            <p className="mt-3 text-[#B8C4D6]">
              Dohvaćam tvoj napredak i otključana postignuća.
            </p>
          </section>
        ) : message ? (
          <section className="rounded-[20px] border border-[#C62828]/35 bg-[#C62828]/15 p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <h2 className="text-3xl font-black text-[#ffb4b4]">Greška</h2>
            <p className="mt-3 font-bold text-[#ffb4b4]">{message}</p>
          </section>
        ) : achievements.length === 0 ? (
          <section className={`${cardClass} p-8 text-center sm:p-12`}>
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#415A77]/25 text-3xl">
              🏆
            </div>

            <h2 className="text-3xl font-black">Još nema achievementa</h2>

            <p className="mx-auto mt-3 max-w-md text-[#B8C4D6]">
              Kada osvojiš prve izazove, tvoji achievementi će se pojaviti
              ovdje.
            </p>

            <Link href="/" className={`${primaryButtonClass} mt-7 inline-flex`}>
              Igraj quiz
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">Otključano</p>
                <p className="mt-2 text-4xl font-black">{unlockedCount}</p>
              </div>

              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">Zaključano</p>
                <p className="mt-2 text-4xl font-black">{lockedCount}</p>
              </div>

              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">Progress</p>
                <p className="mt-2 text-4xl font-black">{progressPercent}%</p>
              </div>
            </section>

            <section className={`${cardClass} mb-6 p-5 sm:p-6`}>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                    Collection Progress
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Tvoj achievement napredak
                  </h2>
                </div>

                <span className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-sm font-black text-[#B8C4D6]">
                  {unlockedCount}/{achievements.length}
                </span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full bg-[#0D1B2A]/80">
                <div
                  className="h-full rounded-full bg-[#388E3C] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {achievements.map((achievement) => (
                <article
                  key={achievement.title}
                  className={`rounded-[20px] border p-5 shadow-[0_18px_45px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 ${
                    achievement.unlocked
                      ? 'border-[#388E3C]/35 bg-[#1B263B]/90'
                      : 'border-[#778DA9]/15 bg-[#1B263B]/65 opacity-75'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black ${
                        achievement.unlocked
                          ? 'bg-[#388E3C]/20 text-[#75d27a]'
                          : 'bg-[#0D1B2A]/70 text-[#778DA9]'
                      }`}
                    >
                      {achievement.unlocked ? '✓' : '🔒'}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                        achievement.unlocked
                          ? 'border border-[#388E3C]/30 bg-[#388E3C]/15 text-[#75d27a]'
                          : 'border border-[#778DA9]/20 bg-[#0D1B2A]/55 text-[#778DA9]'
                      }`}
                    >
                      {achievement.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{achievement.title}</h2>

                  <p className="mt-2 leading-6 text-[#B8C4D6]">
                    {achievement.description}
                  </p>

                  {achievement.unlockedAt && (
                    <p className="mt-4 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-3 text-sm font-bold text-[#B8C4D6]">
                      Otključano:{' '}
                      {new Date(achievement.unlockedAt).toLocaleString('hr-HR')}
                    </p>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}