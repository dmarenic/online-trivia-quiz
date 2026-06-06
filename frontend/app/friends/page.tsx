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
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <Link href="/">← Nazad</Link>

        <h1 className="mb-6 text-center text-4xl font-bold">Friends</h1>

        <form onSubmit={addFriend} className="mb-6 flex gap-3">
          <input
            className="w-full rounded-lg p-3 text-black"
            placeholder="Username prijatelja"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 font-bold hover:bg-blue-700"
          >
            Dodaj
          </button>
        </form>

        {message && (
          <p className="mb-6 rounded-lg bg-zinc-700 p-3 text-center">
            {message}
          </p>
        )}

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Zahtjevi za prijateljstvo</h2>

          {incomingRequests.length === 0 ? (
            <p className="text-zinc-400">Nema novih zahtjeva.</p>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-700 p-4"
                >
                  <span className="font-bold">
                    👤 {request.sender.username}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => acceptRequest(request.id)}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold hover:bg-green-700"
                    >
                      Prihvati
                    </button>

                    <button
                      type="button"
                      onClick={() => rejectRequest(request.id)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold hover:bg-red-700"
                    >
                      Odbij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Poslani zahtjevi</h2>

          {outgoingRequests.length === 0 ? (
            <p className="text-zinc-400">Nema poslanih zahtjeva.</p>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg bg-zinc-700 p-4 font-bold text-zinc-300"
                >
                  ⏳ {request.receiver.username} - čeka potvrdu
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Moji prijatelji</h2>

          {friends.length === 0 ? (
            <p className="text-zinc-400">Još nemaš prijatelja.</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="rounded-lg bg-zinc-700 p-4 font-bold"
                >
                  👤 {getFriendName(friend)}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}