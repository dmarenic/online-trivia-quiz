'use client';

import { useEffect, useState } from 'react';

type Question = {
  id: string;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

type User = {
  id: string;
  username: string;
  email: string;
  role?: string;
};

const emptyForm = {
  category: '',
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: '',
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  async function fetchQuestions() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions`);
    const data = await res.json();
    setQuestions(data);
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      window.location.href = '/login';
      return;
    }

    const parsedUser: User = JSON.parse(savedUser);
    setUser(parsedUser);

    fetchQuestions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    const body = {
      ...form,
      userId: user.id,
    };

    if (editingId) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchQuestions();
  }

  function startEditing(question: Question) {
    setEditingId(question.id);

    setForm({
      category: question.category,
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteQuestion(id: string) {
    if (!user) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    fetchQuestions();
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="mb-6 block text-blue-400 hover:underline">
          ← Nazad na igru
        </a>

        <h1 className="mb-8 text-4xl font-bold">Manage Questions</h1>

        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl bg-zinc-800 p-6"
        >
          <h2 className="mb-4 text-2xl font-bold">
            {editingId ? 'Uredi pitanje' : 'Dodaj novo pitanje'}
          </h2>

          <div className="grid gap-4">
            {Object.keys(form).map((key) => (
              <input
                key={key}
                className="rounded-lg bg-white p-3 text-black"
                placeholder={key}
                value={form[key as keyof typeof form]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]: e.target.value,
                  })
                }
              />
            ))}
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-700"
          >
            {editingId ? 'Spremi promjene' : 'Dodaj pitanje'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="mt-3 w-full rounded-lg bg-zinc-600 p-3 font-bold hover:bg-zinc-700"
            >
              Odustani od uređivanja
            </button>
          )}
        </form>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl bg-zinc-800 p-4">
              <p className="text-sm text-purple-400">{q.category}</p>

              <h2 className="text-xl font-bold">{q.question}</h2>

              <p className="mt-2 text-sm text-zinc-300">
                A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D:{' '}
                {q.optionD}
              </p>

              <p className="mt-2 text-sm text-green-400">
                Točan odgovor: {q.correctAnswer}
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => startEditing(q)}
                  className="rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-600"
                >
                  Uredi
                </button>

                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 font-bold hover:bg-red-700"
                >
                  Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}