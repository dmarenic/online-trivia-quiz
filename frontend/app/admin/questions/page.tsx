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

const categories = [
  'Sport',
  'Geografija',
  'Računarstvo',
  'Povijest',
  'Znanost',
  'Književnost',
  'Umjetnost',
  'Glazba',
  'Videoigre',
  'Trendovi i aktualnosti',
  'Poslovanje i brendovi',
  'Životinje',
  'Ljudsko tijelo i zdravlje',
];

const shellClass =
  'min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] text-[#E0E1DD]';

const cardClass =
  'rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur';

const inputClass =
  'w-full rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/70 px-4 py-3 text-[#E0E1DD] outline-none transition placeholder:text-[#778DA9] focus:border-[#778DA9]/55 focus:ring-4 focus:ring-[#778DA9]/10 disabled:cursor-not-allowed disabled:opacity-60';

const primaryButtonClass =
  'rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0';

const successButtonClass =
  'rounded-2xl bg-[#388E3C] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#43A047] hover:shadow-lg hover:shadow-black/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0';

const dangerButtonClass =
  'rounded-2xl bg-[#C62828] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#D32F2F] hover:shadow-lg hover:shadow-black/20 active:translate-y-0';

const ghostButtonClass =
  'rounded-2xl border border-[#778DA9]/20 px-5 py-3 font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20';

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

  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  const totalCategories = new Set(questions.map((question) => question.category))
    .size;

  return (
    <main className={`${shellClass} px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#778DA9]/15 pb-6 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-[#778DA9]">
              Admin Console
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Manage Questions
            </h1>

            <p className="mt-3 max-w-2xl text-[#B8C4D6]">
              Upravljaj bazom quiz pitanja, ručno dodaj sadržaj ili generiraj
              nova pitanja pomoću AI alata.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {user && (
              <span className="rounded-2xl border border-[#778DA9]/20 bg-[#1B263B]/75 px-5 py-3 font-bold text-[#B8C4D6]">
                {user.username}
              </span>
            )}

            <button type="button" onClick={logout} className={dangerButtonClass}>
              Odjava
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={`${cardClass} p-5`}>
            <p className="text-sm font-bold text-[#778DA9]">Ukupno pitanja</p>
            <p className="mt-2 text-4xl font-black">{questions.length}</p>
          </div>

          <div className={`${cardClass} p-5`}>
            <p className="text-sm font-bold text-[#778DA9]">Kategorije</p>
            <p className="mt-2 text-4xl font-black">{totalCategories}</p>
          </div>

          <div className={`${cardClass} p-5`}>
            <p className="text-sm font-bold text-[#778DA9]">Status</p>
            <p className="mt-2 text-4xl font-black">
              {loadingQuestions ? 'Sync' : 'Ready'}
            </p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <aside className="space-y-6">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                  AI Generator
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Generiranje pitanja
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#B8C4D6]">
                  Unesi temu, kategoriju i težinu. Nova pitanja se nakon
                  generiranja automatski učitavaju u listu.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Tema
                  </span>
                  <input
                    className={inputClass}
                    placeholder="Nogomet, Filmovi, Povijest..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Kategorija
                  </span>
                  <select
                    className={inputClass}
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Težina
                  </span>
                  <select
                    className={inputClass}
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                  >
                    <option value="easy">Lako</option>
                    <option value="medium">Srednje</option>
                    <option value="hard">Teško</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Broj pitanja
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={inputClass}
                    value={aiCount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setAiCount(Math.min(20, Math.max(1, value)));
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={generateAiQuestions}
                  disabled={aiLoading || !aiTopic.trim()}
                  className={`${primaryButtonClass} w-full`}
                >
                  {aiLoading ? 'Generiram...' : 'Generiraj AI pitanja'}
                </button>

                {aiMessage && (
                  <p className="rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/55 p-4 text-center text-sm font-bold text-[#B8C4D6]">
                    {aiMessage}
                  </p>
                )}
              </div>
            </section>

            <form onSubmit={handleSubmit} className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                  Question Editor
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {editingId ? 'Uredi pitanje' : 'Dodaj novo pitanje'}
                </h2>
              </div>

              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Kategorija
                  </span>
                  <input
                    className={inputClass}
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Pitanje
                  </span>
                  <input
                    className={inputClass}
                    value={form.question}
                    onChange={(e) =>
                      setForm({ ...form, question: e.target.value })
                    }
                  />
                </label>

                {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map(
                  (optionKey, index) => (
                    <label key={optionKey} className="block">
                      <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                        Odgovor {String.fromCharCode(65 + index)}
                      </span>
                      <input
                        className={inputClass}
                        value={form[optionKey]}
                        onChange={(e) =>
                          setForm({ ...form, [optionKey]: e.target.value })
                        }
                      />
                    </label>
                  ),
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                    Točan odgovor
                  </span>
                  <select
                    className={inputClass}
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

              <button type="submit" className={`${successButtonClass} mt-6 w-full`}>
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
                  className={`${ghostButtonClass} mt-3 w-full`}
                >
                  Odustani od uređivanja
                </button>
              )}

              {formMessage && (
                <p className="mt-4 rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/55 p-4 text-center text-sm font-bold text-[#B8C4D6]">
                  {formMessage}
                </p>
              )}
            </form>
          </aside>

          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                  Question Bank
                </p>
                <h2 className="mt-2 text-3xl font-black">Lista pitanja</h2>
              </div>

              <span className="rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-sm font-black text-[#B8C4D6]">
                {questions.length} pitanja
              </span>
            </div>

            {loadingQuestions ? (
              <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-center text-[#B8C4D6]">
                Učitavam pitanja...
              </p>
            ) : questions.length === 0 ? (
              <p className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-5 text-center text-[#778DA9]">
                Još nema pitanja u bazi.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <article
                    key={q.id}
                    className="rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/55 p-4 transition hover:border-[#778DA9]/35 hover:bg-[#0D1B2A]/75"
                  >
                    <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <span className="inline-flex rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#B8C4D6]">
                          {q.category}
                        </span>

                        <h3 className="mt-3 text-xl font-black leading-snug">
                          {q.question}
                        </h3>
                      </div>

                      <span className="rounded-full border border-[#388E3C]/30 bg-[#388E3C]/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#75d27a]">
                        Correct: {q.correctAnswer}
                      </span>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {[
                        ['A', q.optionA],
                        ['B', q.optionB],
                        ['C', q.optionC],
                        ['D', q.optionD],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className={`rounded-2xl border p-3 text-sm ${
                            q.correctAnswer === label
                              ? 'border-[#388E3C]/35 bg-[#388E3C]/15 text-[#E0E1DD]'
                              : 'border-[#778DA9]/15 bg-[#1B263B]/50 text-[#B8C4D6]'
                          }`}
                        >
                          <b>{label}:</b> {value}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => startEditing(q)}
                        className={primaryButtonClass}
                      >
                        Uredi
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        className={dangerButtonClass}
                      >
                        Obriši
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}