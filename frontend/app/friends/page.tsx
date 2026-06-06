'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
};

type Friend = {
  id: string;
  sender: User;
  receiver: User;
  status?: string;
};

type FriendsResponse = {
  friends: Friend[];
  incomingRequests: Friend[];
  outgoingRequests: Friend[];
};

const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

const inputClass =
  'w-full rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/70 px-4 py-3 text-[#E0E1DD] outline-none transition placeholder:text-[#778DA9] focus:border-[#778DA9]/55 focus:ring-4 focus:ring-[#778DA9]/10';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const successButtonClass =
  'rounded-2xl bg-[#388E3C] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const dangerButtonClass =
  'rounded-2xl bg-[#C62828] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D32F2F] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

export default function FriendsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [message, setMessage] = useState('');

  const loadFriends = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/friends`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      setMessage('Greška kod učitavanja prijatelja.');
      return;
    }

    const data: FriendsResponse = await res.json();

    setFriends(Array.isArray(data.friends) ? data.friends : []);
    setIncomingRequests(
      Array.isArray(data.incomingRequests) ? data.incomingRequests : [],
    );
    setOutgoingRequests(
      Array.isArray(data.outgoingRequests) ? data.outgoingRequests : [],
    );
  }, [router]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser: User = JSON.parse(savedUser);
      setUser(parsedUser);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    loadFriends();

    const interval = window.setInterval(() => {
      loadFriends();
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadFriends, router]);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !username.trim()) return;

    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/friends`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
        }),
      },
    );

    const data = await res.json();

    if (!data.success) {
      setMessage(data.message || 'Greška kod slanja zahtjeva.');
      return;
    }

    setUsername('');
    setMessage(data.message || 'Zahtjev za prijateljstvo poslan.');
    loadFriends();
  }

  async function acceptRequest(requestId: string) {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/friends/${requestId}/accept`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setMessage('Zahtjev prihvaćen.');
    loadFriends();
  }

  async function rejectRequest(requestId: string) {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/friends/${requestId}/reject`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setMessage('Zahtjev odbijen.');
    loadFriends();
  }

  function getFriendName(friend: Friend) {
    if (!user) return '';

    return friend.sender.id === user.id
      ? friend.receiver.username
      : friend.sender.username;
  }

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#778DA9]/15 pb-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Social Hub
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Friends
            </h1>

            <p className="mt-3 max-w-2xl text-[#B8C4D6]">
              Upravljaj prijateljima, prihvati zahtjeve i dodaj igrače s kojima
              želiš igrati multiplayer quiz.
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-[#778DA9]/20 px-5 py-3 font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
            >
              ← Nazad
            </Link>

            <Link href="/profile" className={primaryButtonClass}>
              Moj profil
            </Link>
          </nav>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ['Prijatelji', friends.length],
            ['Novi zahtjevi', incomingRequests.length],
            ['Poslani zahtjevi', outgoingRequests.length],
          ].map(([label, value]) => (
            <div key={label} className={`${cardClass} p-5`}>
              <p className="text-sm font-bold text-[#778DA9]">{label}</p>
              <p className="mt-2 text-4xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className={`${cardClass} mb-6 p-5 sm:p-6`}>
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
              Add friend
            </p>
            <h2 className="mt-2 text-2xl font-black">Dodaj prijatelja</h2>
          </div>

          <form onSubmit={addFriend} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className={inputClass}
              placeholder="Username prijatelja"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <button type="submit" className={primaryButtonClass}>
              Dodaj
            </button>
          </form>

          {message && (
            <div className="mt-5 rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/55 p-4 text-center font-bold text-[#B8C4D6]">
              {message}
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Zahtjevi za prijateljstvo</h2>

              <span className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#B8C4D6]">
                {incomingRequests.length} pending
              </span>
            </div>

            {incomingRequests.length === 0 ? (
              <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                Nema novih zahtjeva.
              </p>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black">
                        {request.sender.username}
                      </p>
                      <p className="text-sm text-[#778DA9]">
                        Želi te dodati kao prijatelja
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <button
                        type="button"
                        onClick={() => acceptRequest(request.id)}
                        className={successButtonClass}
                      >
                        Prihvati
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectRequest(request.id)}
                        className={dangerButtonClass}
                      >
                        Odbij
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Poslani zahtjevi</h2>

              <span className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#B8C4D6]">
                {outgoingRequests.length} waiting
              </span>
            </div>

            {outgoingRequests.length === 0 ? (
              <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
                Nema poslanih zahtjeva.
              </p>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75"
                  >
                    <p className="font-black">{request.receiver.username}</p>
                    <p className="mt-1 text-sm text-[#778DA9]">
                      Čeka potvrdu zahtjeva
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className={`${cardClass} mt-6 p-5 sm:p-6`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Moji prijatelji</h2>

            <span className="rounded-full border border-[#778DA9]/20 bg-[#388E3C]/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#75d27a]">
              {friends.length} active
            </span>
          </div>

          {friends.length === 0 ? (
            <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-[#778DA9]">
              Još nemaš prijatelja.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:-translate-y-0.5 hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75"
                >
                  <p className="truncate text-lg font-black">
                    {getFriendName(friend)}
                  </p>
                  <p className="mt-1 text-sm text-[#778DA9]">
                    Dostupan za pozive u sobu
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}