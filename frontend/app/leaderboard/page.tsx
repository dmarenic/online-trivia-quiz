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
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-4xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <h1 className="mb-2 text-center text-4xl font-bold">
          Rezultati sobe
        </h1>

        {roomCode && (
          <p className="mb-6 text-center text-zinc-400">
            Kod sobe: <b>{roomCode}</b>
          </p>
        )}

        <button
          type="button"
          onClick={goBackToLobby}
          className="mb-4 text-blue-400 hover:underline"
        >
          ← Nazad u lobby
        </button>

        {games.length === 0 ? (
          <p className="text-center text-zinc-400">
            Još nema rezultata za ovu sobu.
          </p>
        ) : (
          <>
            <section className="mb-10 rounded-xl bg-zinc-700 p-6">
              <h2 className="mb-4 text-2xl font-bold">Statistika</h2>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-zinc-800 p-4 text-center">
                  <p className="text-3xl font-bold">{totalGames}</p>
                  <p className="text-sm text-zinc-400">Igara</p>
                </div>

                <div className="rounded-lg bg-zinc-800 p-4 text-center">
                  <p className="text-3xl font-bold">{totalPlayers}</p>
                  <p className="text-sm text-zinc-400">Igrača</p>
                </div>

                <div className="rounded-lg bg-zinc-800 p-4 text-center">
                  <p className="text-3xl font-bold">{totalPoints}</p>
                  <p className="text-sm text-zinc-400">Ukupno bodova</p>
                </div>

                <div className="rounded-lg bg-zinc-800 p-4 text-center">
                  <p className="text-3xl font-bold">{totalCorrectAnswers}</p>
                  <p className="text-sm text-zinc-400">Točnih odgovora</p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold">
                Overall leaderboard
              </h2>

              <div className="space-y-3">
                {overallLeaderboard.map((player, index) => (
                  <div
                    key={player.nickname}
                    className="flex items-center justify-between rounded-lg bg-zinc-700 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                        alt={player.nickname}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full"
                        unoptimized
                      />

                      <div>
                        <p className="font-bold">
                          {index === 0
                            ? '🥇'
                            : index === 1
                              ? '🥈'
                              : index === 2
                                ? '🥉'
                                : `${index + 1}.`}{' '}
                          {player.nickname}
                        </p>

                        <p className="text-sm text-zinc-400">
                          Igre: {player.gamesPlayed} | Točno:{' '}
                          {player.totalCorrectAnswers}
                        </p>
                      </div>
                    </div>

                    <span className="text-xl font-bold">
                      {player.totalScore} bodova
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              {games.map((game) => (
                <div key={game.gameNumber}>
                  <h2 className="mb-4 text-2xl font-bold">
                    Game {game.gameNumber}
                  </h2>

                  <p className="mb-4 text-sm text-zinc-400">
                    {new Date(game.playedAt).toLocaleString()}
                  </p>

                  <div className="space-y-3">
                    {[...game.players]
                      .sort((a, b) => b.score - a.score)
                      .map((player, index) => (
                        <div
                          key={`${game.gameNumber}-${player.id}`}
                          className="flex items-center justify-between rounded-lg bg-zinc-700 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <Image
                              src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${player.nickname}`}
                              alt={player.nickname}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full"
                              unoptimized
                            />

                            <div>
                              <p className="font-bold">
                                {index === 0
                                  ? '🥇'
                                  : index === 1
                                    ? '🥈'
                                    : index === 2
                                      ? '🥉'
                                      : `${index + 1}.`}{' '}
                                {player.nickname}
                              </p>

                              <p className="text-sm text-zinc-400">
                                Točni odgovori: {player.correctAnswers}
                              </p>
                            </div>
                          </div>

                          <span className="text-xl font-bold">
                            {player.score} bodova
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </section>

            <button
              type="button"
              onClick={clearRoomResults}
              className="mt-10 w-full rounded-xl bg-red-600 p-4 font-bold hover:bg-red-700"
            >
              Obriši rezultate ove sobe
            </button>
          </>
        )}
      </div>
    </main>
  );
}