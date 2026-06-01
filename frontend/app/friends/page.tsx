"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string;
};

type Friend = {
  id: string;
  sender: User;
  receiver: User;
};

export default function FriendsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [message, setMessage] = useState("");

  async function loadFriends(userId: string) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/friends`
    );

    const data = await res.json();
    setFriends(data);
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    loadFriends(parsedUser.id);
  }, []);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !username.trim()) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/friends`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
        }),
      }
    );

    const data = await res.json();

    if (!data.success) {
      setMessage(data.message || "Greška kod dodavanja prijatelja.");
      return;
    }

    setUsername("");
    setMessage("Prijatelj dodan.");
    loadFriends(user.id);
  }

  function getFriendName(friend: Friend) {
    if (!user) return "";

    return friend.sender.id === user.id
      ? friend.receiver.username
      : friend.sender.username;
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <a href="/" className="mb-6 block text-blue-400 hover:underline">
          ← Nazad na igru
        </a>

        <h1 className="mb-6 text-center text-4xl font-bold">Friends</h1>

        <form onSubmit={addFriend} className="mb-6 flex gap-3">
          <input
            className="w-full rounded-lg p-3 text-black"
            placeholder="Username prijatelja"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button className="rounded-lg bg-blue-600 px-4 font-bold hover:bg-blue-700">
            Dodaj
          </button>
        </form>

        {message && (
          <p className="mb-6 rounded-lg bg-zinc-700 p-3 text-center">
            {message}
          </p>
        )}

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
      </div>
    </main>
  );
}