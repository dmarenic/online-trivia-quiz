'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '@/src/lib/api';
import {
  cardClass,
  inputClass,
  primaryButtonClass,
  shellClass,
  successButtonClass,
} from '@/src/lib/ui';

type User = {
  id: string;
  username: string;
  email: string;
  role?: string;
  avatar?: string;
};

type Invite = {
  id: string;
  roomCode: string;
  fromUser?: {
    username?: string;
  };
};

function playSound(src: string) {
  const audio = new Audio(src);
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

const dangerButtonClass =
  'rounded-2xl bg-[#C62828] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D32F2F]';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  // Dok se auth-stanje ne pročita iz localStorage, ne prikazujemo formu
  // (izbjegava bljesak forme prijavljenom korisniku).
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase());
    }

    if (!savedUser) {
      setLoading(false);
      return;
    }

    let socket: Socket | null = null;
    let hasConnectedOnce = false;

    const inviteTimers = new Map<string, number>();
    const hiddenInviteIds = new Set<string>();

    const deleteInviteFromBackend = async (inviteId: string) => {
      if (!token) return;

      await apiFetch(`/users/room-invites/${inviteId}`, {
        method: 'DELETE',
      }).catch(() => {});
    };

    const removeInvite = (inviteId: string, deleteFromBackend = false) => {
      hiddenInviteIds.add(inviteId);
      setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));

      const oldTimer = inviteTimers.get(inviteId);
      if (oldTimer) {
        window.clearTimeout(oldTimer);
        inviteTimers.delete(inviteId);
      }

      if (deleteFromBackend) {
        deleteInviteFromBackend(inviteId).catch(() => {});
      }
    };

    const scheduleInviteRemoval = (inviteId: string) => {
      const oldTimer = inviteTimers.get(inviteId);
      if (oldTimer) {
        window.clearTimeout(oldTimer);
      }

      const timer = window.setTimeout(() => {
        removeInvite(inviteId, true);
      }, 30000);

      inviteTimers.set(inviteId, timer);
    };

    const addInvite = (invite: Invite) => {
      if (hiddenInviteIds.has(invite.id)) return;

      setInvites((prev) => {
        const alreadyExists = prev.some((item) => item.id === invite.id);
        if (alreadyExists) return prev;

        scheduleInviteRemoval(invite.id);

        return [
          invite,
          ...prev.filter(
            (oldInvite) =>
              !(
                oldInvite.roomCode === invite.roomCode &&
                oldInvite.id !== invite.id
              ),
          ),
        ];
      });
    };

    const fetchInvites = async () => {
      if (!token) return;

      const data = await apiFetch<Invite[]>('/users/me/room-invites');
      const fetchedInvites: Invite[] = Array.isArray(data) ? data : [];

      setInvites(
        fetchedInvites.filter((invite) => !hiddenInviteIds.has(invite.id)),
      );

      fetchedInvites.forEach((invite) => {
        if (!hiddenInviteIds.has(invite.id)) {
          scheduleInviteRemoval(invite.id);
        }
      });
    };

    try {
      const parsedUser: User = JSON.parse(savedUser);

      if (parsedUser.role?.toLowerCase() === 'admin') {
        window.location.href = '/admin/questions';
        return;
      }

      setUser(parsedUser);
      setNickname(parsedUser.username);
      setLoading(false);

      socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        transports: ['websocket'],
        auth: {
          token,
        },
      });

      socket.on('connect', () => {
        socket?.emit('join_user_channel', { userId: parsedUser.id });

        // Prvo spajanje pokriva pocetni fetchInvites() nize; nakon reconnecta
        // treba ponovno dohvatiti pozivnice koje su stigle dok je veza bila
        // prekinuta - u normalnom radu ih donosi room_invite_received event.
        if (hasConnectedOnce) {
          fetchInvites().catch(() => {});
        }

        hasConnectedOnce = true;
      });

      socket.on('room_invite_received', (invite: Invite) => {
        playSound('/sounds/invite-received.mp3');
        addInvite(invite);
      });

      socket.on('room_invite_expired', (data: { inviteId: string }) => {
        removeInvite(data.inviteId);
      });

      fetchInvites().catch(() => {});
    } catch {
      localStorage.removeItem('user');
      setLoading(false);
    }

    return () => {
      socket?.disconnect();

      inviteTimers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
    localStorage.removeItem('currentRoom');
    localStorage.removeItem('returnToRoom');
    localStorage.removeItem('lastRoomCode');

    setUser(null);
    setNickname('');
    setRoomCode('');
    setInvites([]);
  }

  function createRoom() {
    if (!nickname.trim()) return;

    localStorage.setItem('nickname', nickname.trim());
    window.location.href = '/room?mode=create';
  }

  function joinRoom(code?: string) {
    const finalRoomCode = (code ?? roomCode).trim().toUpperCase();

    if (!nickname.trim() || !finalRoomCode) return;

    playSound('/sounds/join-room.mp3');
    localStorage.setItem('nickname', nickname.trim());

    setTimeout(() => {
      window.location.href = `/room?room=${finalRoomCode}`;
    }, 200);
  }

  async function rejectInvite(inviteId: string) {
    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));

    const token = localStorage.getItem('token');

    if (!token) return;

    await apiFetch(`/users/room-invites/${inviteId}`, {
      method: 'DELETE',
    }).catch(() => {});
  }

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-7xl flex-col">
        <header className="mb-10 flex flex-col justify-between gap-4 rounded-[20px] border border-[#778DA9]/15 bg-[#1B263B]/55 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:px-6">
          <Link href="/" className="text-lg font-black tracking-tight">
            Trivia Quiz
          </Link>

          {user ? (
            <nav className="flex flex-wrap items-center gap-3">
              <Link
                href="/profile"
                className="rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
              >
                {user.username}
              </Link>

              <Link
                href="/friends"
                className="rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
              >
                Friends
              </Link>

              <button
                type="button"
                onClick={logout}
                className={dangerButtonClass}
              >
                Odjava
              </button>
            </nav>
          ) : (
            <nav className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
              >
                Prijava
              </Link>

              <Link href="/register" className={primaryButtonClass}>
                Registracija
              </Link>
            </nav>
          )}
        </header>

        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#B8C4D6]">
              Multiplayer trivia platform
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Online Trivia Quiz za brze, pametne i kompetitivne igre.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[#B8C4D6]">
              Kreiraj sobu, pozovi prijatelje i natječite se kroz moderne quiz
              runde s jasnim rezultatima, live statusima i leaderboardom.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/55 p-4">
                <p className="text-2xl font-black">Live</p>
                <p className="mt-1 text-sm text-[#778DA9]">multiplayer</p>
              </div>

              <div className="rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/55 p-4">
                <p className="text-2xl font-black">Daily</p>
                <p className="mt-1 text-sm text-[#778DA9]">challenge</p>
              </div>

              <div className="rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/55 p-4">
                <p className="text-2xl font-black">Ranked</p>
                <p className="mt-1 text-sm text-[#778DA9]">leaderboard</p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-5 sm:p-7`}>
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                Quick start
              </p>
              <h2 className="mt-2 text-3xl font-black">Pokreni igru</h2>
              <p className="mt-2 text-[#B8C4D6]">
                Unesi nickname i kreiraj novu sobu ili se pridruži postojećoj.
              </p>
            </div>

            {invites.length > 0 && (
              <div className="mb-6 rounded-[20px] border border-[#778DA9]/20 bg-[#0D1B2A]/55 p-4">
                <h3 className="mb-3 text-lg font-black">Pozivnice</h3>

                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="relative rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/75 p-4"
                    >
                      <button
                        type="button"
                        onClick={() => rejectInvite(invite.id)}
                        className="absolute right-3 top-3 rounded-full border border-[#C62828]/30 bg-[#C62828]/15 px-2.5 py-1 text-xs font-black text-[#ffb4b4] transition hover:bg-[#C62828] hover:text-white"
                        aria-label="Odbij pozivnicu"
                      >
                        X
                      </button>

                      <p className="mb-3 pr-8 text-sm text-[#B8C4D6]">
                        <b className="text-[#E0E1DD]">
                          {invite.fromUser?.username ?? 'Prijatelj'}
                        </b>{' '}
                        te pozvao u sobu{' '}
                        <b className="font-mono text-[#E0E1DD]">
                          {invite.roomCode}
                        </b>
                      </p>

                      <button
                        type="button"
                        onClick={() => joinRoom(invite.roomCode)}
                        className={`${successButtonClass} w-full`}
                      >
                        Pridruži se
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading &&
              (user ? (
                <div className="mb-4 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4">
                  <p className="text-sm text-[#778DA9]">Ulaziš kao</p>
                  <p className="font-black text-[#E0E1DD]">{user.username}</p>
                </div>
              ) : (
                <>
                  <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Nickname
                  </label>
                  <input
                    className={`${inputClass} mb-4`}
                    placeholder="Unesi nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </>
              ))}

            <button
              type="button"
              onClick={createRoom}
              className={`${primaryButtonClass} mb-4 w-full`}
            >
              Kreiraj sobu
            </button>

            {roomCode && (
              <div className="mb-4 rounded-2xl border border-[#388E3C]/30 bg-[#388E3C]/15 p-3 text-center font-bold text-[#75d27a]">
                Pozvan si u sobu: {roomCode}
              </div>
            )}

            <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
              Kod sobe
            </label>
            <input
              className={`${inputClass} mb-4 font-mono uppercase tracking-widest`}
              placeholder="Unesi kod sobe"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />

            <button
              type="button"
              onClick={() => joinRoom()}
              className={`${successButtonClass} w-full`}
            >
              Pridruži se sobi
            </button>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/daily"
                className="rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/55 px-4 py-3 text-center font-bold transition hover:-translate-y-0.5 hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
              >
                Daily Challenge
              </Link>

              <Link
                href="/daily/leaderboard"
                className="rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/55 px-4 py-3 text-center font-bold transition hover:-translate-y-0.5 hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
              >
                Daily Leaderboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
