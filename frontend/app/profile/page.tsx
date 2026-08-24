'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '@/src/lib/api';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/src/lib/validation';
import {
  cardClass,
  dangerButtonClass,
  inputClass,
  shellClass,
  successButtonClass,
} from '@/src/lib/ui';

type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
};

type UserStats = {
  totalGames: number;
  bestScore: number;
  averageScore: number;
  accuracy: number;
};

type MatchHistoryItem = {
  id: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  mode: string;
  createdAt: string;
};

type RoomInvite = {
  id: string;
  roomCode: string;
  fromUser: {
    username: string;
  };
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [dailyResults, setDailyResults] = useState<MatchHistoryItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [roomInvites, setRoomInvites] = useState<RoomInvite[]>([]);
  const [avatarInput, setAvatarInput] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    async function loadProfile() {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!savedUser || !token) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.replace('/login');
        return;
      }

      const parsedUser: User = JSON.parse(savedUser);

      setUser(parsedUser);
      setAvatarInput(parsedUser.avatar || parsedUser.username);

      try {
        const statsData = await apiFetch<UserStats>('/users/me/stats');
        setStats(statsData);
      } catch (err) {
        console.error('Greška kod statistike:', err);
      }

      try {
        // Jedan izvor za povijest: graf, popis mečeva i daily lista sve se
        // izvode iz istog odgovora umjesto da se dohvaća drugi, gotovo isti
        // endpoint.
        const historyData = await apiFetch<MatchHistoryItem[]>(
          '/users/me/match-history',
        );
        const history = Array.isArray(historyData) ? historyData : [];

        setMatchHistory(history);
        setDailyResults(history.filter((match) => match.mode === 'daily'));
      } catch (err) {
        console.error('Greška kod match history:', err);
      }

      try {
        const invitesData = await apiFetch<RoomInvite[]>(
          '/users/me/room-invites',
        );
        setRoomInvites(Array.isArray(invitesData) ? invitesData : []);
      } catch (err) {
        console.error('Greška kod pozivnica:', err);
      }
    }

    loadProfile();
  }, []);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast(message);
    setToastType(type);

    setTimeout(() => {
      setToast('');
    }, 3000);
  }

  async function updateAvatar() {
    if (!user || !avatarInput.trim()) return;

    try {
      const updatedUser = await apiFetch<User>('/users/me/avatar', {
        method: 'PATCH',
        body: JSON.stringify({
          avatar: avatarInput,
        }),
      });

      const newUser = {
        ...user,
        avatar: updatedUser.avatar,
      };

      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch {
      showToast('Avatar nije spremljen. Pokušaj ponovno.', 'error');
    }
  }

  function startEditingUsername() {
    if (!user) return;
    setUsernameInput(user.username);
    setEditingUsername(true);
  }

  async function updateUsername() {
    if (!user) return;

    const trimmed = usernameInput.trim();

    if (
      trimmed.length < USERNAME_MIN_LENGTH ||
      trimmed.length > USERNAME_MAX_LENGTH
    ) {
      showToast(
        `Nadimak mora imati ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} znakova.`,
        'error',
      );
      return;
    }

    if (trimmed === user.username) {
      setEditingUsername(false);
      return;
    }

    setSavingUsername(true);

    try {
      // Ne ide kroz apiFetch: treba razlikovati 409 (nadimak zauzet) od ostalih
      // grešaka, a apiFetch sve pretvara u istu iznimku.
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/username`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ username: trimmed }),
        },
      );

      if (res.status === 409) {
        showToast('Taj nadimak je već zauzet.', 'error');
        return;
      }

      if (!res.ok) {
        showToast('Nadimak nije spremljen. Pokušaj ponovno.', 'error');
        return;
      }

      const updatedUser = await res.json();

      const newUser = {
        ...user,
        username: updatedUser.username,
      };

      setUser(newUser);
      // Landing (app/page.tsx) i /room čitaju nadimak iz 'user'/'nickname' —
      // osvježi oboje da se odmah koristi novi nadimak svugdje.
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('nickname', updatedUser.username);

      setEditingUsername(false);
      showToast('Nadimak je spremljen.', 'success');
    } catch {
      showToast('Nadimak nije spremljen. Pokušaj ponovno.', 'error');
    } finally {
      setSavingUsername(false);
    }
  }

  async function deleteInvite(inviteId: string) {
    try {
      await apiFetch(`/users/room-invites/${inviteId}`, {
        method: 'DELETE',
      });

      setRoomInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
    } catch {
      showToast('Pozivnica nije obrisana. Pokušaj ponovno.', 'error');
    }
  }

  const avatarSeed = encodeURIComponent(
    (user?.avatar || user?.username || 'Player').trim(),
  );

  // Povijest stiže od najnovijeg prema najstarijem; graf prikazuje zadnjih 10
  // partija kronološki (najstarija lijevo).
  const chartData = matchHistory
    .slice(0, 10)
    .reverse()
    .map((match, index) => ({
      name: `Igra ${index + 1}`,
      score: match.score,
    }));

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 rounded-[20px] border border-[#778DA9]/15 bg-[#1B263B]/55 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:px-6">
          <Link
            href="/"
            className="rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
          >
            ← Nazad
          </Link>
        </header>

        {user && (
          <section className={`${cardClass} mb-6 overflow-hidden`}>
            <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
              <div className="border-b border-[#778DA9]/15 bg-[#0D1B2A]/35 p-6 text-center lg:border-b-0 lg:border-r">
                <Image
                  src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${avatarSeed}`}
                  alt={user.username}
                  width={128}
                  height={128}
                  className="mx-auto mb-4 h-32 w-32 rounded-full bg-[#0D1B2A] ring-4 ring-[#778DA9]/20"
                  unoptimized
                />

                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                  Player Profile
                </p>
                {editingUsername ? (
                  <div className="mt-2">
                    <input
                      className={`${inputClass} text-center text-xl font-black`}
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      maxLength={30}
                      autoFocus
                      disabled={savingUsername}
                    />

                    <div className="mt-3 flex justify-center gap-2">
                      <button
                        onClick={updateUsername}
                        disabled={savingUsername}
                        className={`${successButtonClass} px-4 py-2 text-sm disabled:opacity-50`}
                      >
                        {savingUsername ? 'Spremam…' : 'Spremi'}
                      </button>
                      <button
                        onClick={() => setEditingUsername(false)}
                        disabled={savingUsername}
                        className="rounded-2xl border border-[#778DA9]/25 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:bg-[#415A77]/20 disabled:opacity-50"
                      >
                        Odustani
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <h1 className="truncate text-4xl font-black tracking-tight">
                      {user.username}
                    </h1>
                    <button
                      onClick={startEditingUsername}
                      aria-label="Promijeni nadimak"
                      title="Promijeni nadimak"
                      className="shrink-0 rounded-full border border-[#778DA9]/25 p-2 text-sm text-[#B8C4D6] transition hover:border-[#778DA9]/50 hover:bg-[#415A77]/20"
                    >
                      ✏️
                    </button>
                  </div>
                )}
                <p className="mt-2 truncate text-[#B8C4D6]">{user.email}</p>
              </div>

              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className={inputClass}
                    placeholder="Avatar seed"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                  />

                  <button onClick={updateAvatar} className={successButtonClass}>
                    Spremi avatar
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {stats && (
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Ukupno igara', stats.totalGames],
              ['Najbolji rezultat', stats.bestScore],
              ['Prosječan score', stats.averageScore],
              ['Točnost', `${stats.accuracy}%`],
            ].map(([label, value]) => (
              <div key={label} className={`${cardClass} p-5`}>
                <p className="text-sm font-bold text-[#778DA9]">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
            ))}
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {chartData.length > 0 && (
              <section className={`${cardClass} p-5 sm:p-6`}>
                <h2 className="mb-5 text-2xl font-black">
                  Zadnjih 10 rezultata
                </h2>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="rgba(119,141,169,0.18)" />
                      <XAxis
                        dataKey="name"
                        stroke="#778DA9"
                        tick={{ fill: '#B8C4D6', fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#778DA9"
                        tick={{ fill: '#B8C4D6', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1B263B',
                          border: '1px solid rgba(119,141,169,0.25)',
                          borderRadius: 16,
                          color: '#E0E1DD',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#778DA9"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-5 text-2xl font-black">Match History</h2>

              {matchHistory.length === 0 ? (
                <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                  Još nema odigranih mečeva.
                </p>
              ) : (
                <div className="space-y-3">
                  {matchHistory.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-black">
                          {new Date(match.createdAt).toLocaleDateString(
                            'hr-HR',
                          )}
                        </p>
                        <p className="mt-1 text-sm text-[#778DA9]">
                          Mode: {match.mode}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-left sm:text-right">
                        <div>
                          <p className="text-sm text-[#778DA9]">Score</p>
                          <p className="font-black">{match.score}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#778DA9]">Točnost</p>
                          <p className="font-black">{match.accuracy}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#778DA9]">Točno</p>
                          <p className="font-black">
                            {match.correctAnswers}/{match.totalQuestions}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            {roomInvites.length > 0 && (
              <section className={`${cardClass} p-5 sm:p-6`}>
                <h2 className="mb-5 text-2xl font-black">Pozivnice u sobe</h2>

                <div className="space-y-3">
                  {roomInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4"
                    >
                      <p className="mb-4 text-[#B8C4D6]">
                        <strong className="text-[#E0E1DD]">
                          {invite.fromUser.username}
                        </strong>{' '}
                        te poziva u sobu{' '}
                        <strong className="font-mono text-[#E0E1DD]">
                          {invite.roomCode}
                        </strong>
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <Link
                          href={`/?room=${invite.roomCode}`}
                          className={`${successButtonClass} text-center`}
                        >
                          Pridruži se
                        </Link>

                        <button
                          onClick={() => deleteInvite(invite.id)}
                          className={dangerButtonClass}
                        >
                          Obriši
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black">Daily History</h2>
                <Link
                  href="/daily"
                  className="rounded-full border border-[#778DA9]/20 px-3 py-1.5 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
                >
                  Daily
                </Link>
              </div>

              {dailyResults.length === 0 ? (
                <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                  Još nema daily rezultata.
                </p>
              ) : (
                <div className="space-y-3">
                  {dailyResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex justify-between rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4"
                    >
                      <span>
                        {new Date(result.createdAt).toLocaleDateString('hr-HR')}
                      </span>
                      <b>{result.score} bodova</b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-2xl border px-5 py-3 font-bold shadow-xl backdrop-blur ${
            toastType === 'success'
              ? 'border-[#388E3C]/30 bg-[#388E3C]/15 text-[#75d27a]'
              : 'border-[#C62828]/30 bg-[#C62828]/15 text-[#ffb4b4]'
          }`}
        >
          {toast}
        </div>
      )}
    </main>
  );
}
