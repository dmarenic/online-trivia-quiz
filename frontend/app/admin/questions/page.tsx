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

  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('Sport');
  const [aiDifficulty, setAiDifficulty] = useState('easy');
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

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

    if (parsedUser.role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }

    setUser(parsedUser);
    fetchQuestions();
  }, []);

  async function generateAiQuestions() {
    if (!user) {
      setAiMessage('Moraš biti prijavljen kao admin.');
      return;
    }

    if (user.role !== 'ADMIN') {
      setAiMessage('Nemaš admin prava.');
      return;
    }

    if (!aiTopic.trim()) {
      setAiMessage('Unesi temu za generiranje pitanja.');
      return;
    }

    setAiLoading(true);
    setAiMessage('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/questions/generate-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: aiTopic,
            category: aiCategory,
            difficulty: aiDifficulty,
            count: aiCount,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAiMessage(data.message || 'Greška kod AI generiranja pitanja.');
        return;
      }

      setAiMessage(data.message || 'Pitanja su uspješno generirana.');
      setAiTopic('');
      fetchQuestions();
    } catch (error) {
      console.error(error);
      setAiMessage('Greška kod spajanja na backend.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    const body = {
      ...form,
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

        <section className="mb-10 rounded-2xl bg-zinc-800 p-6 shadow-xl">
          <h2 className="mb-4 text-2xl font-bold">🤖 AI generiranje pitanja</h2>

          <input
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            placeholder="Tema, npr. Nogomet, Filmovi, Povijest..."
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
          />

          <select
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            value={aiCategory}
            onChange={(e) => setAiCategory(e.target.value)}
          >
            <option value="Sport">Sport</option>
            <option value="Geografija">Geografija</option>
            <option value="Matematika">Matematika</option>
            <option value="Računarstvo">Računarstvo</option>
            <option value="Povijest">Povijest</option>
            <option value="Filmovi">Filmovi</option>
          </select>

          <select
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            value={aiDifficulty}
            onChange={(e) => setAiDifficulty(e.target.value)}
          >
            <option value="easy">Lako</option>
            <option value="medium">Srednje</option>
            <option value="hard">Teško</option>
          </select>

          <input
            type="number"
            min={1}
            max={20}
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            value={aiCount}
            onChange={(e) => setAiCount(Number(e.target.value))}
          />

          <button
            type="button"
            onClick={generateAiQuestions}
            disabled={aiLoading || !aiTopic.trim()}
            className="w-full rounded-lg bg-purple-600 p-3 font-bold hover:bg-purple-700 disabled:bg-zinc-600"
          >
            {aiLoading ? 'Generiram...' : 'Generiraj AI pitanja'}
          </button>

          {aiMessage && (
            <p className="mt-4 rounded-lg bg-zinc-700 p-3 text-center">
              {aiMessage}
            </p>
          )}
        </section>

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