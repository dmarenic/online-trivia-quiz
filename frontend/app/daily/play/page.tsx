'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Question = {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer?: string;
};

type DailyAnswer = {
  questionId: string;
  answer: string;
};

type DailyChallenge = {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  category: string;
};

function playSound(src: string) {
  const audio = new Audio(src);
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

export default function DailyPlayPage() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    [],
  );
  const [answers, setAnswers] = useState<DailyAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    async function loadDaily() {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!savedUser || !token) {
        window.location.replace('/login');
        return;
      }

      const statusRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/status/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const status = await statusRes.json();

      if (status.played) {
        window.location.replace('/daily');
        return;
      }

      const challengeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge`,
      );

      const challengeData: DailyChallenge = await challengeRes.json();
      setChallenge(challengeData);

      const questionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/${challengeData.id}/questions`,
      );

      const questionsData: Question[] = await questionsRes.json();
      setQuestions(questionsData);
    }

    loadDaily();
  }, []);

  async function submitAnswers(finalAnswers: DailyAnswer[]) {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      window.location.replace('/login');
      return;
    }

    const user = JSON.parse(savedUser);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/daily-challenge/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: user.username,
          answers: finalAnswers,
        }),
      },
    );

    const data = await res.json();

    setScore(data.score ?? 0);
    setResultMessage(data.message || 'Rezultat je spremljen.');
    setUnlockedAchievements(data.unlockedAchievements || []);

    if (data.success) {
      const updatedUser = {
        ...user,
        xp: data.totalXp ?? user.xp,
        level: data.level ?? user.level,
        dailyStreak: data.dailyStreak ?? user.dailyStreak,
        lastDailyDate: new Date().toISOString().split('T')[0],
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  function answer(option: string) {
    if (locked) return;

    const question = questions[current];
    const isCorrect = question.correctAnswer === option;

    setLocked(true);
    setSelectedAnswer(option);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      playSound('/sounds/correct.mp3');
      setScore((prev) => prev + 1000);
    } else {
      playSound('/sounds/wrong.mp3');
    }

    const newAnswers = [
      ...answers,
      {
        questionId: question.id,
        answer: option,
      },
    ];

    setAnswers(newAnswers);

    setTimeout(() => {
      setSelectedAnswer(null);
      setFeedback(null);
      setLocked(false);

      if (current + 1 >= questions.length) {
        submitAnswers(newAnswers);
        setFinished(true);
      } else {
        setCurrent((prev) => prev + 1);
      }
    }, 900);
  }

  function getOptionClass(option: string) {
    if (!selectedAnswer) {
      return 'bg-blue-600 hover:bg-blue-700';
    }

    if (option === selectedAnswer && feedback === 'correct') {
      return 'bg-green-600 ring-4 ring-green-300';
    }

    if (option === selectedAnswer && feedback === 'wrong') {
      return 'bg-red-600 ring-4 ring-red-300';
    }

    return 'bg-zinc-700 opacity-60';
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
            {resultMessage || 'Rezultat je spremljen.'}
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

          <Link
            href="/daily"
            className="block rounded-lg bg-yellow-500 p-3 font-bold text-black hover:bg-yellow-400"
          >
            Nazad na Daily Challenge
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-zinc-800 p-8 shadow-xl">
        <Link href="/daily">← Nazad</Link>

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

        {feedback && (
          <div
            className={`mb-4 rounded-lg p-3 text-center text-lg font-bold ${
              feedback === 'correct' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {feedback === 'correct' ? '✅ Točan odgovor!' : '❌ Netočan odgovor!'}
          </div>
        )}

        <div className="space-y-4">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => answer(option)}
              className={`w-full rounded-lg p-4 text-left font-bold transition ${getOptionClass(
                option,
              )}`}
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