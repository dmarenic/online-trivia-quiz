'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type PlayerResult = {
  id: string;
  nickname: string;
  score: number;
  correctAnswers: number;
};

type GameHistory = {
  gameNumber: number;
  playedAt: string;
  roomCode?: string;
  players: PlayerResult[];
};

const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const dangerButtonClass =
  'rounded-2xl bg-[#C62828] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D32F2F] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

function getRankLabel(index: number) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';

  return index + 1;
}

export default function LeaderboardPage() {
  const [games, setGames] = useState<GameHistory[]>([]);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const savedRoomCode = localStorage.getItem('lastRoomCode') ?? '';
    setRoomCode(savedRoomCode);

    const roomHistoryKey = savedRoomCode
      ? `roomGameHistory:${savedRoomCode}`
      : 'roomGameHistory';

    const savedHistory = localStorage.getItem(roomHistoryKey);

    if (savedHistory) {
      setGames(JSON.parse(savedHistory));
    } else {
      setGames([]);
    }
  }, []);

  const overallLeaderboard = useMemo(() => {
    const playerMap = new Map<
      string,
      {
        id: string;
        nickname: string;
        totalScore: number;
        totalCorrectAnswers: number;
        gamesPlayed: number;
      }
    >();

    games.forEach((game) => {
      game.players.forEach((player) => {
        const existing = playerMap.get(player.nickname);

        if (existing) {
          existing.totalScore += player.score;
          existing.totalCorrectAnswers += player.correctAnswers;
          existing.gamesPlayed += 1;
        } else {
          playerMap.set(player.nickname, {
            id: player.id,
            nickname: player.nickname,
            totalScore: player.score,
            totalCorrectAnswers: player.correctAnswers,
            gamesPlayed: 1,
          });
        }
      });
    });

    return Array.from(playerMap.values()).sort(
      (a, b) => b.totalScore - a.totalScore,
    );
  }, [games]);

  const totalGames = games.length;
  const totalPlayers = overallLeaderboard.length;
  const totalPoints = overallLeaderboard.reduce(
    (sum, player) => sum + player.totalScore,
    0,
  );
  const totalCorrectAnswers = overallLeaderboard.reduce(
    (sum, player) => sum + player.totalCorrectAnswers,
    0,
  );

  function goBackToLobby() {
    const returnUrl = localStorage.getItem('returnToRoom');

    if (returnUrl) {
      window.location.href = returnUrl;
      return;
    }

    if (roomCode) {
      window.location.href = `/room?room=${roomCode}`;
      return;
    }

    window.location.href = '/';
  }

  function clearRoomResults() {
    if (!roomCode) return;

    localStorage.removeItem(`roomGameHistory:${roomCode}`);
    setGames([]);
  }

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#778DA9]/15 pb-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Room Analytics
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Rezultati sobe
              </h1>

              {roomCode && (
                <span className="rounded-full border border-[#778DA9]/20 bg-[#1B263B] px-4 py-2 font-mono text-sm font-black tracking-widest text-[#B8C4D6]">
                  {roomCode}
                </span>
              )}
            </div>

            <p className="mt-3 max-w-2xl text-[#B8C4D6]">
              Pregled ukupnog poretka, statistike sobe i rezultata po svakoj
              odigranoj igri.
            </p>
          </div>

          <button type="button" onClick={goBackToLobby} className={primaryButtonClass}>
            ← Nazad u lobby
          </button>
        </header>

        {games.length === 0 ? (
          <section className={`${cardClass} p-8 text-center sm:p-12`}>
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#415A77]/25 text-3xl">
              🏆
            </div>

            <h2 className="text-3xl font-black">Još nema rezultata</h2>

            <p className="mx-auto mt-3 max-w-md text-[#B8C4D6]">
              Nakon završene igre u ovoj sobi ovdje će se prikazati ukupni
              leaderboard i povijest mečeva.
            </p>

            <button
              type="button"
              onClick={goBackToLobby}
              className={`${primaryButtonClass} mt-7`}
            >
              Vrati se u lobby
            </button>
          </section>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Igara', totalGames],
                ['Igrača', totalPlayers],
                ['Ukupno bodova', totalPoints],
                ['Točnih odgovora', totalCorrectAnswers],
              ].map(([label, value]) => (
                <div key={label} className={`${cardClass} p-5`}>
                  <p className="text-sm font-bold text-[#778DA9]">{label}</p>
                  <p className="mt-2 text-4xl font-black">{value}</p>
                </div>
              ))}
            </section>

            <section className={`${cardClass} mb-6 p-5 sm:p-6`}>
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                    Overall Ranking
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Ukupni leaderboard
                  </h2>
                </div>

                <span className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-sm font-black text-[#B8C4D6]">
                  {totalPlayers} igrača
                </span>
              </div>

              <div className="space-y-3">
                {overallLeaderboard.map((player, index) => (
                  <div
                    key={player.nickname}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75 sm:flex-row sm:items-center"
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
                        className="h-12 w-12 rounded-full ring-2 ring-[#778DA9]/25"
                        unoptimized
                      />

                      <div className="min-w-0">
                        <p className="truncate text-lg font-black">
                          {player.nickname}
                        </p>
                        <p className="text-sm text-[#778DA9]">
                          Igre: {player.gamesPlayed} · Točno:{' '}
                          {player.totalCorrectAnswers}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-black">
                        {player.totalScore}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#778DA9]">
                        bodova
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              {games.map((game) => (
                <article key={game.gameNumber} className={`${cardClass} p-5 sm:p-6`}>
                  <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                        Match History
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        Game {game.gameNumber}
                      </h2>

                      <p className="mt-1 text-sm text-[#778DA9]">
                        {new Date(game.playedAt).toLocaleString('hr-HR')}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#778DA9]/20 bg-[#0D1B2A]/55 px-4 py-2 text-sm font-black text-[#B8C4D6]">
                      {game.players.length} igrača
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[...game.players]
                      .sort((a, b) => b.score - a.score)
                      .map((player, index) => (
                        <div
                          key={`${game.gameNumber}-${player.id}`}
                          className="flex flex-col justify-between gap-4 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#415A77]/30 text-base font-black">
                              {getRankLabel(index)}
                            </span>

                            <Image
                              src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                              alt={player.nickname}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full ring-2 ring-[#778DA9]/25"
                              unoptimized
                            />

                            <div className="min-w-0">
                              <p className="truncate font-black">
                                {player.nickname}
                              </p>
                              <p className="text-sm text-[#778DA9]">
                                Točni odgovori: {player.correctAnswers}
                              </p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-2xl font-black">
                              {player.score}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#778DA9]">
                              bodova
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </article>
              ))}
            </section>

            <button
              type="button"
              onClick={clearRoomResults}
              className={`${dangerButtonClass} mt-8 w-full`}
            >
              Obriši rezultate ove sobe
            </button>
          </>
        )}
      </div>
    </main>
  );
}