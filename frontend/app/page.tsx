'use client';

import { useEffect, useState } from 'react';
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
    const savedUser = localStorage.getItem('user');

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');

    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase());
    }

    if (!savedUser) return;

    const parsedUser: User = JSON.parse(savedUser);

    setUser(parsedUser);
    setNickname(parsedUser.username);

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join_user_channel', {
        userId: parsedUser.id,
      });
    });

    socket.on('room_invite_received', (invite: Invite) => {
      playSound('/sounds/invite-received.mp3');

      setInvites((prev) => {
        const alreadyExists = prev.some((item) => item.id === invite.id);

        if (alreadyExists) return prev;

        return [invite, ...prev];
      });
    });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${parsedUser.id}/invites`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        setInvites(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setInvites([]);
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  function logout() {
    localStorage.removeItem('user');
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <div className="w-full max-w-md rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          {user ? (
            <>
              <a href="/profile" className="font-bold text-blue-400 hover:underline">
                👤 {user.username}
              </a>

              <a href="/friends" className="text-blue-400 hover:underline">
                Friends
              </a>

              <button
                onClick={logout}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold hover:bg-red-700"
              >
                Odjava
              </button>
            </>
          ) : (
            <div className="flex w-full justify-center gap-4">
              <a href="/login" className="text-blue-400 hover:underline">
                Prijava
              </a>

              <a href="/register" className="text-blue-400 hover:underline">
                Registracija
              </a>
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
                className="mb-3 rounded-lg bg-zinc-800 p-3 last:mb-0"
              >
                <p className="mb-3 text-sm">
                  <b>{invite.fromUser?.username ?? 'Prijatelj'}</b> te pozvao u
                  sobu <b>{invite.roomCode}</b>
                </p>

                <button
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
          onClick={() => joinRoom()}
          className="w-full rounded-lg bg-green-600 p-3 font-bold hover:bg-green-700"
        >
          Pridruži se sobi
        </button>

        <a
          href="/daily"
          className="mt-4 block rounded-lg bg-yellow-500 p-3 text-center font-bold text-black hover:bg-yellow-400"
        >
          🏅 Daily Challenge
        </a>

        <a
          href="/daily/leaderboard"
          className="mt-4 block text-center text-sm text-blue-400 hover:underline"
        >
          🏅 Daily Leaderboard
        </a>
      </div>
    </main>
  );
}