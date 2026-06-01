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
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge`)
      .then((res) => res.json())
      .then((data) => setChallenge(data));

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${user.id}/status`)
        .then((res) => res.json())
        .then((data) => setPlayed(data.played));
    }
  }, []);

  const claimReward = async () => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      setMessage("Moraš biti prijavljen.");
      return;
    }

    const user = JSON.parse(savedUser);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${user.id}/check`,
      { method: "POST" }
    );

    const data = await response.json();

    if (data.success) {
      setMessage(`🎉 Osvojio si ${data.rewardXp} XP!`);
    } else {
      setMessage(data.message);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f9fd] p-8 text-[#233350]">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#b0c9d4]/60 bg-white/85 p-8 shadow-xl backdrop-blur">
        <a
          href="/"
          className="mb-6 block font-semibold text-[#7ca5b8] transition hover:text-[#233350] hover:underline"
        >
          ← Nazad na igru
        </a>

        <h1 className="mb-6 text-center text-4xl font-extrabold">
          🏅 Daily Challenge
        </h1>

        {!challenge ? (
          <p className="text-center text-[#7ca5b8]">Učitavanje...</p>
        ) : (
          <div className="rounded-3xl border border-[#b0c9d4]/50 bg-[#f6f9fd] p-6 text-center shadow-inner">
            <h2 className="mb-3 text-2xl font-bold">{challenge.title}</h2>

            <p className="mb-4 text-[#2f2f2f]/75">{challenge.description}</p>

            <p className="mb-2">
              Cilj: <b>{challenge.targetScore}</b> bodova
            </p>

            {played ? (
              <p className="mt-4 rounded-2xl bg-[#a8d8b9] p-3 font-bold text-[#233350]">
                ✅ Daily Challenge završen danas
              </p>
            ) : (
              <a
                href="/daily/play"
                className="mt-4 block rounded-2xl bg-[#7ca5b8] p-3 font-bold text-white shadow-md transition hover:bg-[#5f8fa6] hover:shadow-lg"
              >
                ▶️ Start Daily Challenge
              </a>
            )}

            <button
              onClick={claimReward}
              className="mt-4 w-full rounded-2xl border border-[#b0c9d4] bg-white px-4 py-3 font-bold text-[#233350] transition hover:bg-[#f6f9fd]"
            >
              Preuzmi nagradu
            </button>

            {message && <p className="mt-4 text-lg font-semibold">{message}</p>}
          </div>
        )}
      </div>
    </main>
  );
}