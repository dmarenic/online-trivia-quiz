"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  category: string;
};

export default function DailyPlayPage() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    []
  );

  useEffect(() => {
    async function loadDaily() {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(savedUser);

      const statusRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${user.id}/status`
      );

      const status = await statusRes.json();

      if (status.played) {
        window.location.href = "/daily";
        return;
      }

      const challengeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge`
      );

      const challengeData = await challengeRes.json();
      setChallenge(challengeData);

      const questionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${challengeData.id}/questions`
      );

      const questionsData = await questionsRes.json();
      setQuestions(questionsData);
    }

    loadDaily();
  }, []);

  async function submitScore(finalScore: number) {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) return;

    const user = JSON.parse(savedUser);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${user.id}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: finalScore,
          nickname: user.username,
        }),
      }
    );

    const data = await res.json();

    setResultMessage(data.message || "Rezultat je spremljen.");
    setUnlockedAchievements(data.unlockedAchievements || []);

    if (data.success) {
      const updatedUser = {
        ...user,
        xp: data.totalXp ?? user.xp,
        level: data.level ?? user.level,
        dailyStreak: data.dailyStreak ?? user.dailyStreak,
        lastDailyDate: new Date().toISOString().split("T")[0],
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  }

  function answer(option: string) {
    const question = questions[current];

    let newScore = score;

    if (option === question.correctAnswer) {
      newScore = score + 1000;
      setScore(newScore);
    }

    if (current + 1 >= questions.length) {
      submitScore(newScore);
      setFinished(true);
    } else {
      setCurrent((prev) => prev + 1);
    }
  }

  if (!challenge || questions.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-900 p-8 text-white">
        <p className="text-center">Učitavanje daily challengea...</p>
      </main>
    );
  }

  const activeChallenge = challenge;
  const question = questions[current];

  if (finished) {
    return (
      <main className="min-h-screen bg-zinc-900 p-8 text-white">
        <div className="mx-auto max-w-xl rounded-2xl bg-zinc-800 p-8 text-center shadow-xl">
          <h1 className="mb-6 text-4xl font-bold">Daily Challenge završen!</h1>

          <p className="mb-4 text-2xl">
            Score: <b>{score}</b>
          </p>

          <p className="mb-6 text-zinc-400">
            {resultMessage || "Rezultat je spremljen."}
          </p>

          {unlockedAchievements.length > 0 && (
            <div className="mb-6 rounded-xl bg-yellow-500 p-4 text-black">
              <h2 className="mb-3 text-xl font-bold">
                🏆 Achievement unlocked!
              </h2>

              <div className="space-y-2">
                {unlockedAchievements.map((achievement) => (
                  <p key={achievement} className="font-bold">
                    {achievement}
                  </p>
                ))}
              </div>
            </div>
          )}

          <a
            href="/daily"
            className="block rounded-lg bg-yellow-500 p-3 font-bold text-black hover:bg-yellow-400"
          >
            Nazad na Daily Challenge
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <a href="/daily" className="mb-6 block text-blue-400 hover:underline">
          ← Nazad
        </a>

        <p className="mb-2 text-center text-sm uppercase tracking-widest text-yellow-400">
          {activeChallenge.category}
        </p>

        <h1 className="mb-4 text-center text-3xl font-bold">
          {activeChallenge.title}
        </h1>

        <p className="mb-6 text-center text-zinc-400">
          Pitanje {current + 1} / {questions.length}
        </p>

        <h2 className="mb-8 text-2xl font-bold">{question.question}</h2>

        <div className="space-y-4">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => answer(option)}
              className="w-full rounded-lg bg-blue-600 p-4 text-left font-bold hover:bg-blue-700"
            >
              {option}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-zinc-400">Score: {score}</p>
      </div>
    </main>
  );
}