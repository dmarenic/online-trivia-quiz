"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

const shellClass =
  "min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]";

const cardClass =
  "rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur";

const primaryButtonClass =
  "rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0";

function getRankLabel(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return index + 1;
}

export default function DailyLeaderboardPage() {
  const [results, setResults] = useState<DailyResult[]>([]);

  useEffect(() => {
  async function loadLeaderboard() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/leaderboard`,
      );

      if (!res.ok) {
        throw new Error('Greška kod dohvaćanja daily leaderboarda.');
      }

      const data = await res.json();

      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setResults([]);
    }
  }

  loadLeaderboard();
}, []);

  const topScore = results[0]?.score ?? 0;

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#778DA9]/15 pb-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Daily Rankings
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Daily Leaderboard
            </h1>

            <p className="mt-3 max-w-2xl text-[#B8C4D6]">
              Pregled najboljih dnevnih rezultata i poretka igrača za Daily
              Challenge.
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/daily"
              className="rounded-2xl border border-[#778DA9]/20 px-5 py-3 font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
            >
              ← Nazad
            </Link>

            <Link href="/daily/play" className={primaryButtonClass}>
              Igraj Daily
            </Link>
          </nav>
        </header>

        {results.length === 0 ? (
          <section className={`${cardClass} p-8 text-center sm:p-12`}>
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#415A77]/25 text-3xl">
              🏅
            </div>

            <h2 className="text-3xl font-black">Još nema daily rezultata</h2>

            <p className="mx-auto mt-3 max-w-md text-[#B8C4D6]">
              Kada igrači završe Daily Challenge, rezultati će se prikazati
              ovdje.
            </p>

            <Link href="/daily" className={`${primaryButtonClass} mt-7 inline-flex`}>
              Otvori Daily Challenge
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">Rezultata</p>
                <p className="mt-2 text-4xl font-black">{results.length}</p>
              </div>

              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">Top score</p>
                <p className="mt-2 text-4xl font-black">{topScore}</p>
              </div>

              <div className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">Status</p>
                <p className="mt-2 text-4xl font-black">Live</p>
              </div>
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                    Ranked Players
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Današnji poredak
                  </h2>
                </div>

                <span className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-sm font-black text-[#B8C4D6]">
                  {results.length} igrača
                </span>
              </div>

              <div className="space-y-3">
                {results.map((result, index) => {
                  const player = {
                    nickname: result.user?.username || result.nickname,
                  };

                  return (
                    <div
                      key={result.id}
                      className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:flex-row sm:items-center ${
                        index < 3
                          ? "border-[#388E3C]/25 bg-[#0D1B2A]/70"
                          : "border-[#778DA9]/15 bg-[#0D1B2A]/55 hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#415A77]/35 text-lg font-black">
                          {getRankLabel(index)}
                        </span>

                        <Image
                          src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                          alt={player.nickname}
                          width={52}
                          height={52}
                          className="h-12 w-12 rounded-full bg-[#0D1B2A] ring-2 ring-[#778DA9]/25"
                          unoptimized
                        />

                        <div className="min-w-0">
                          <p className="truncate text-lg font-black">
                            {result.user?.username || result.nickname}
                          </p>

                          <p className="text-sm text-[#778DA9]">
                            {new Date(result.createdAt).toLocaleString("hr-HR")}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-black">{result.score}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#778DA9]">
                          bodova
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}