'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../src/lib/api';

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

type AiGenerateResponse = {
  success: boolean;
  message?: string;
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

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  async function fetchQuestions() {
    try {
      setLoadingQuestions(true);
      const data = await apiFetch<Question[]>('/questions');
      setQuestions(data);
    } catch (error) {
      console.error(error);
      setFormMessage('Greška kod dohvaćanja pitanja.');
    } finally {
      setLoadingQuestions(false);
    }
  }

  useEffect(() => {
  async function initialize() {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      window.location.replace('/login');
      return;
    }

    try {
      const parsedUser: User = JSON.parse(savedUser);

      if (parsedUser.role?.toLowerCase() !== 'admin') {
  window.location.replace('/');
  return;
}

      queueMicrotask(() => {
        setUser(parsedUser);
      });

      await fetchQuestions();
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.replace('/login');
    }
  }

  initialize();
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
      const data = await apiFetch<AiGenerateResponse>(
        '/questions/generate-ai',
        {
          method: 'POST',
          body: JSON.stringify({
            topic: aiTopic.trim(),
            category: aiCategory,
            difficulty: aiDifficulty,
            count: aiCount,
          }),
        },
      );

      if (!data.success) {
        setAiMessage(data.message || 'Greška kod AI generiranja pitanja.');
        return;
      }

      setAiMessage(data.message || 'Pitanja su uspješno generirana.');
      setAiTopic('');
      await fetchQuestions();
    } catch (error) {
      console.error(error);
      setAiMessage('Greška kod spajanja na backend ili nemaš admin prava.');
    } finally {
      setAiLoading(false);
    }
  }

  function validateForm() {
    const values = Object.values(form).map((value) => value.trim());

    if (values.some((value) => !value)) {
      setFormMessage('Sva polja su obavezna.');
      return false;
    }

    const validAnswers = ['A', 'B', 'C', 'D'];

    if (!validAnswers.includes(form.correctAnswer.trim().toUpperCase())) {
      setFormMessage('Točan odgovor mora biti A, B, C ili D.');
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    setFormMessage('');

    if (!validateForm()) return;

    const body = {
      category: form.category.trim(),
      question: form.question.trim(),
      optionA: form.optionA.trim(),
      optionB: form.optionB.trim(),
      optionC: form.optionC.trim(),
      optionD: form.optionD.trim(),
      correctAnswer: form.correctAnswer.trim().toUpperCase(),
    };

    try {
      if (editingId) {
        await apiFetch(`/questions/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });

        setFormMessage('Pitanje je uspješno ažurirano.');
      } else {
        await apiFetch('/questions', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        setFormMessage('Pitanje je uspješno dodano.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchQuestions();
    } catch (error) {
      console.error(error);
      setFormMessage('Greška kod spremanja pitanja. Provjeri admin prava.');
    }
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

    setFormMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteQuestion(id: string) {
    if (!user) return;

    const confirmed = window.confirm(
      'Jesi siguran da želiš obrisati ovo pitanje?',
    );

    if (!confirmed) return;

    try {
      await apiFetch(`/questions/${id}`, {
        method: 'DELETE',
      });

      setFormMessage('Pitanje je obrisano.');
      await fetchQuestions();
    } catch (error) {
      console.error(error);
      setFormMessage('Greška kod brisanja pitanja. Provjeri admin prava.');
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-4xl">
      
        <button
  type="button"
  onClick={() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }}
>
  Odjava
</button>

        <h1 className="mb-8 text-4xl font-bold">Manage Questions</h1>

        <section className="mb-10 rounded-2xl bg-zinc-800 p-6 shadow-xl">
          <h2 className="mb-4 text-2xl font-bold">🤖 AI generiranje pitanja</h2>

          <label className="mb-2 block text-sm font-semibold">Tema</label>
          <input
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            placeholder="Tema, npr. Nogomet, Filmovi, Povijest..."
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
          />

          <label className="mb-2 block text-sm font-semibold">Kategorija</label>
          <select
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            value={aiCategory}
            onChange={(e) => setAiCategory(e.target.value)}
          >
            <option value="Sport">Sport</option>
            <option value="Geografija">Geografija</option>
            <option value="Računarstvo">Računarstvo</option>
            <option value="Povijest">Povijest</option>
            <option value="Znanost">Znanost</option>
            <option value="Književnost">Književnost</option>
            <option value="Umjetnost">Umjetnost</option>
            <option value="Glazba">Glazba</option>
            <option value="Videoigre">Videoigre</option>
            <option value="Trendovi i aktualnosti">Trendovi i aktualnosti</option>
            <option value="Poslovanje i brendovi">Poslovanje i brendovi</option>
            <option value="Životinje">Životinje</option>
            <option value="Ljudsko tijelo i zdravlje">Ljudsko tijelo i zdravlje</option>
          </select>

          <label className="mb-2 block text-sm font-semibold">Težina</label>
          <select
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            value={aiDifficulty}
            onChange={(e) => setAiDifficulty(e.target.value)}
          >
            <option value="easy">Lako</option>
            <option value="medium">Srednje</option>
            <option value="hard">Teško</option>
          </select>

          <label className="mb-2 block text-sm font-semibold">
            Broj pitanja
          </label>
          <input
            type="number"
            min={1}
            max={20}
            className="mb-3 w-full rounded-lg bg-white p-3 text-black"
            value={aiCount}
            onChange={(e) => {
              const value = Number(e.target.value);
              setAiCount(Math.min(20, Math.max(1, value)));
            }}
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
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Kategorija
              </span>
              <input
                className="w-full rounded-lg bg-white p-3 text-black"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Pitanje</span>
              <input
                className="w-full rounded-lg bg-white p-3 text-black"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Odgovor A
              </span>
              <input
                className="w-full rounded-lg bg-white p-3 text-black"
                value={form.optionA}
                onChange={(e) => setForm({ ...form, optionA: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Odgovor B
              </span>
              <input
                className="w-full rounded-lg bg-white p-3 text-black"
                value={form.optionB}
                onChange={(e) => setForm({ ...form, optionB: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Odgovor C
              </span>
              <input
                className="w-full rounded-lg bg-white p-3 text-black"
                value={form.optionC}
                onChange={(e) => setForm({ ...form, optionC: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Odgovor D
              </span>
              <input
                className="w-full rounded-lg bg-white p-3 text-black"
                value={form.optionD}
                onChange={(e) => setForm({ ...form, optionD: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">
                Točan odgovor
              </span>
              <select
                className="w-full rounded-lg bg-white p-3 text-black"
                value={form.correctAnswer}
                onChange={(e) =>
                  setForm({ ...form, correctAnswer: e.target.value })
                }
              >
                <option value="">Odaberi točan odgovor</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>
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
                setFormMessage('');
              }}
              className="mt-3 w-full rounded-lg bg-zinc-600 p-3 font-bold hover:bg-zinc-700"
            >
              Odustani od uređivanja
            </button>
          )}

          {formMessage && (
            <p className="mt-4 rounded-lg bg-zinc-700 p-3 text-center">
              {formMessage}
            </p>
          )}
        </form>

        {loadingQuestions ? (
          <p className="rounded-lg bg-zinc-800 p-4 text-center">
            Učitavam pitanja...
          </p>
        ) : (
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
                    type="button"
                    onClick={() => startEditing(q)}
                    className="rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-600"
                  >
                    Uredi
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteQuestion(q.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 font-bold hover:bg-red-700"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}