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

const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const successButtonClass =
  'rounded-2xl bg-[#388E3C] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

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
      return 'border-[#778DA9]/20 bg-[#1B263B]/88 text-[#E0E1DD] hover:-translate-y-0.5 hover:border-[#778DA9]/45 hover:bg-[#243551]';
    }

    if (option === selectedAnswer && feedback === 'correct') {
      return 'border-[#388E3C]/50 bg-[#388E3C]/20 text-[#75d27a] ring-4 ring-[#388E3C]/15';
    }

    if (option === selectedAnswer && feedback === 'wrong') {
      return 'border-[#C62828]/50 bg-[#C62828]/20 text-[#ffb4b4] ring-4 ring-[#C62828]/15';
    }

    return 'border-[#778DA9]/10 bg-[#0D1B2A]/45 text-[#778DA9] opacity-60';
  }

  if (!challenge || questions.length === 0) {
    return (
      <main className={`${shellClass} flex items-center justify-center p-6`}>
        <section className={`${cardClass} w-full max-w-md p-8 text-center`}>
          <div className="mx-auto mb-5 h-14 w-14 animate-pulse rounded-2xl bg-[#415A77]/35" />
          <h1 className="text-3xl font-black">
            Učitavanje daily challengea...
          </h1>
          <p className="mt-3 text-[#B8C4D6]">
            Pripremam pitanja i provjeravam tvoj status.
          </p>
        </section>
      </main>
    );
  }

  const activeChallenge = challenge;
  const question = questions[current];
  const progressPercent = ((current + 1) / questions.length) * 100;

  if (finished) {
    return (
      <main className={`${shellClass} flex items-center justify-center p-4 sm:p-6`}>
        <section className={`${cardClass} w-full max-w-2xl p-5 text-center sm:p-8`}>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
            Daily Results
          </p>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Daily Challenge završen!
          </h1>

          <div className="mx-auto mt-7 max-w-sm rounded-[20px] border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-[#778DA9]">
              Final Score
            </p>
            <p className="mt-2 text-6xl font-black">{score}</p>
            <p className="mt-1 text-[#B8C4D6]">bodova</p>
          </div>

          <p className="mx-auto mt-6 max-w-md text-[#B8C4D6]">
            {resultMessage || 'Rezultat je spremljen.'}
          </p>

          {unlockedAchievements.length > 0 && (
            <div className="mt-6 rounded-[20px] border border-[#388E3C]/35 bg-[#388E3C]/15 p-5 text-left">
              <h2 className="mb-4 text-xl font-black text-[#75d27a]">
                Achievement unlocked
              </h2>

              <div className="space-y-3">
                {unlockedAchievements.map((achievement) => (
                  <p
                    key={achievement}
                    className="rounded-2xl border border-[#388E3C]/20 bg-[#0D1B2A]/35 p-3 font-bold text-[#E0E1DD]"
                  >
                    {achievement}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/daily"
            className={`${primaryButtonClass} mt-7 inline-flex w-full justify-center sm:w-auto`}
          >
            Nazad na Daily Challenge
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-[20px] border border-[#778DA9]/15 bg-[#1B263B]/55 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:px-6">
          <Link
            href="/daily"
            className="rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
          >
            ← Nazad
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-sm font-black text-[#B8C4D6]">
              Score: {score}
            </span>

            <span className="rounded-full border border-[#778DA9]/20 bg-[#0D1B2A]/55 px-4 py-2 text-sm font-black text-[#B8C4D6]">
              {current + 1}/{questions.length}
            </span>
          </div>
        </header>

        <section className={`${cardClass} mb-6 overflow-hidden`}>
          <div className="h-2 w-full bg-[#0D1B2A]/80">
            <div
              className="h-full bg-[#388E3C] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="p-5 text-center sm:p-8">
            <span className="inline-flex rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#B8C4D6]">
              {activeChallenge.category}
            </span>

            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              {activeChallenge.title}
            </h1>

            <p className="mt-3 text-[#B8C4D6]">
              Pitanje {current + 1} od {questions.length}
            </p>

            <h2 className="mx-auto mt-8 max-w-3xl text-2xl font-black leading-tight sm:text-4xl">
              {question.question}
            </h2>
          </div>
        </section>

        {feedback && (
          <div
            className={`mb-5 rounded-2xl border p-4 text-center text-lg font-black ${
              feedback === 'correct'
                ? 'border-[#388E3C]/35 bg-[#388E3C]/15 text-[#75d27a]'
                : 'border-[#C62828]/35 bg-[#C62828]/15 text-[#ffb4b4]'
            }`}
          >
            {feedback === 'correct' ? 'Točan odgovor!' : 'Netočan odgovor!'}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          {question.options.map((option, index) => (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => answer(option)}
              className={`group flex min-h-20 items-center gap-4 rounded-[20px] border p-5 text-left font-black shadow-[0_14px_45px_rgba(0,0,0,0.18)] transition disabled:cursor-not-allowed ${getOptionClass(
                option,
              )}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0D1B2A] text-sm font-black text-[#B8C4D6] transition group-hover:bg-[#415A77] group-hover:text-white">
                {String.fromCharCode(65 + index)}
              </span>

              <span>{option}</span>
            </button>
          ))}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className={`${cardClass} p-5`}>
            <p className="text-sm font-bold text-[#778DA9]">Score</p>
            <p className="mt-2 text-3xl font-black">{score}</p>
          </div>

          <div className={`${cardClass} p-5`}>
            <p className="text-sm font-bold text-[#778DA9]">Reward</p>
            <p className="mt-2 text-3xl font-black">
              {activeChallenge.rewardXp}
            </p>
            <p className="text-sm text-[#778DA9]">XP</p>
          </div>

          <div className={`${cardClass} p-5`}>
            <p className="text-sm font-bold text-[#778DA9]">Progress</p>
            <p className="mt-2 text-3xl font-black">
              {Math.round(progressPercent)}%
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}