"use client";

import { useEffect, useState } from "react";

type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  targetScore: number;
  rewardXp: number;
  date: string;
};

export default function DailyPage() {
  const [played, setPlayed] = useState(false);
  const [challenge, setChallenge] =
    useState<DailyChallenge | null>(null);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge`,
    )
      .then((res) => res.json())
      .then((data) => setChallenge(data));
  }, []);

  const savedUser = localStorage.getItem("user");

if (savedUser) {
  const user = JSON.parse(savedUser);

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${user.id}/status`)
    .then((res) => res.json())
    .then((data) => setPlayed(data.played));
}
  const claimReward = async () => {
    const savedUser =
      localStorage.getItem("user");

    if (!savedUser) {
      setMessage(
        "Moraš biti prijavljen.",
      );
      return;
    }

    const user =
      JSON.parse(savedUser);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${user.id}/check`,
      {
        method: "POST",
      },
    );
    

    const data =
      await response.json();

    if (data.success) {
      setMessage(
        `🎉 Osvojio si ${data.rewardXp} XP!`,
      );
    } else {
      setMessage(
        data.message,
      );
    }
  };

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <a
          href="/"
          className="mb-6 block text-blue-400 hover:underline"
        >
          ← Nazad na igru
        </a>

        <h1 className="mb-6 text-center text-4xl font-bold">
          🏅 Daily Challenge
        </h1>

        {!challenge ? (
          <p className="text-center text-zinc-400">
            Učitavanje...
          </p>
        ) : (
          <div className="rounded-xl bg-zinc-700 p-6 text-center">
            <h2 className="mb-3 text-2xl font-bold">
              {challenge.title}
            </h2>

            <p className="mb-4 text-zinc-300">
              {challenge.description}
            </p>

            <p className="mb-2">
              Cilj:
              <b>
                {" "}
                {challenge.targetScore}
              </b>{" "}
              bodova
            </p>

            {played ? (
  <p className="mt-4 rounded-lg bg-green-600 p-3 font-bold">
    ✅ Daily Challenge završen danas
  </p>
) : (
  <a
    href="/daily/play"
    className="mt-4 block rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-700"
  >
    ▶️ Start Daily Challenge
  </a>
)}


            

            {message && (
              <p className="mt-4 text-lg">
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}