'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

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

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase());
    }

    if (!savedUser) return;

    let socket: Socket | null = null;
    let inviteInterval: number | null = null;

    const inviteTimers = new Map<string, number>();
    const hiddenInviteIds = new Set<string>();

    const deleteInviteFromBackend = async (inviteId: string) => {
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/room-invites/${inviteId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ).catch(() => {});
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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/room-invites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) return;

      const data = await res.json();
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

      socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        transports: ['websocket'],
        auth: {
          token,
        },
      });

      socket.on('connect', () => {
        socket?.emit('join_user_channel', { userId: parsedUser.id });
      });

      socket.on('room_invite_received', (invite: Invite) => {
        playSound('/sounds/invite-received.mp3');
        addInvite(invite);
      });

      socket.on('room_invite_expired', (data: { inviteId: string }) => {
        removeInvite(data.inviteId);
      });

      fetchInvites().catch(() => {});

      inviteInterval = window.setInterval(() => {
        fetchInvites().catch(() => {});
      }, 2000);
    } catch {
      localStorage.removeItem('user');
    }

    return () => {
      socket?.disconnect();

      if (inviteInterval) {
        window.clearInterval(inviteInterval);
      }

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

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/room-invites/${inviteId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    ).catch(() => {});
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <div className="w-full max-w-md rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          {user ? (
            <>
              <Link
                href="/profile"
                className="font-bold text-blue-400 hover:underline"
              >
                👤 {user.username}
              </Link>

              <Link href="/friends" className="text-blue-400 hover:underline">
                Friends
              </Link>

              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold hover:bg-red-700"
              >
                Odjava
              </button>
            </>
          ) : (
            <div className="flex w-full justify-center gap-4">
              <Link href="/login" className="text-blue-400 hover:underline">
                Prijava
              </Link>

              <Link href="/register" className="text-blue-400 hover:underline">
                Registracija
              </Link>
            </div>
          )}
        </div>

        <h1 className="mb-6 text-center text-4xl font-bold">
          Online Trivia Quiz
        </h1>

        {invites.length > 0 && (
          <div className="mb-6 rounded-xl bg-zinc-700 p-4">
            <h2 className="mb-3 text-xl font-bold">📩 Pozivnice</h2>

            {invites.map((invite) => (
              <div
                key={invite.id}
                className="relative mb-3 rounded-lg bg-zinc-800 p-3 last:mb-0"
              >
                <button
                  type="button"
                  onClick={() => rejectInvite(invite.id)}
                  className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold hover:bg-red-700"
                  aria-label="Odbij pozivnicu"
                >
                  X
                </button>

                <p className="mb-3 pr-8 text-sm">
                  <b>{invite.fromUser?.username ?? 'Prijatelj'}</b> te pozvao u
                  sobu <b>{invite.roomCode}</b>
                </p>

                <button
                  type="button"
                  onClick={() => joinRoom(invite.roomCode)}
                  className="w-full rounded-lg bg-green-600 p-2 font-bold hover:bg-green-700"
                >
                  Pridruži se
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          className="mb-4 w-full rounded-lg bg-white p-3 text-black"
          placeholder="Unesi nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <button
          type="button"
          onClick={createRoom}
          className="mb-4 w-full rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-700"
        >
          Kreiraj sobu
        </button>

        {roomCode && (
          <div className="mb-4 rounded-lg bg-purple-600 p-3 text-center font-bold">
            🎮 Pozvan si u sobu: {roomCode}
          </div>
        )}

        <input
          className="mb-4 w-full rounded-lg bg-white p-3 text-black"
          placeholder="Unesi kod sobe ili koristi invite link"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />

        <button
          type="button"
          onClick={() => joinRoom()}
          className="w-full rounded-lg bg-green-600 p-3 font-bold hover:bg-green-700"
        >
          Pridruži se sobi
        </button>

        <Link
          href="/daily"
          className="mt-4 block rounded-lg bg-yellow-500 p-3 text-center font-bold text-black hover:bg-yellow-400"
        >
          🏅 Daily Challenge
        </Link>

        <Link
          href="/"
          className="mt-4 block text-center text-sm text-blue-400 hover:underline"
        >
          🏅 Daily Leaderboard
        </Link>
      </div>
    </main>
  );
}