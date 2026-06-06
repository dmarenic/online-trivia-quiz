"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Greška kod prijave");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.accessToken);

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,rgba(65,90,119,0.2),transparent_34%),linear-gradient(180deg,#0D1B2A_0%,#071523_100%)] px-4 py-6 text-[#E0E1DD] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="hidden lg:block">
            <Link
              href="/"
              className="mb-10 inline-flex rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20"
            >
              ← Nazad na početnu
            </Link>

            <p className="mb-4 inline-flex rounded-full border border-[#778DA9]/20 bg-[#415A77]/20 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#B8C4D6]">
              Player account
            </p>

            <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight">
              Vrati se u svoju trivia arenu.
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-[#B8C4D6]">
              Prijavi se za pristup profilu, prijateljima, leaderboardu,
              daily challenge rezultatima i multiplayer sobama.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/55 p-4">
                <p className="text-2xl font-black">XP</p>
                <p className="mt-1 text-sm text-[#778DA9]">progress</p>
              </div>

              <div className="rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/55 p-4">
                <p className="text-2xl font-black">Rank</p>
                <p className="mt-1 text-sm text-[#778DA9]">leaderboard</p>
              </div>

              <div className="rounded-2xl border border-[#778DA9]/15 bg-[#1B263B]/55 p-4">
                <p className="text-2xl font-black">Live</p>
                <p className="mt-1 text-sm text-[#778DA9]">rooms</p>
              </div>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#778DA9]/20 bg-[#1B263B]/88 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8">
            <div className="mb-7">
              <Link
                href="/"
                className="mb-6 inline-flex rounded-full border border-[#778DA9]/20 px-4 py-2 text-sm font-bold text-[#B8C4D6] transition hover:border-[#778DA9]/45 hover:bg-[#415A77]/20 lg:hidden"
              >
                ← Nazad
              </Link>

              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#778DA9]">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Prijava
              </h2>

              <p className="mt-2 text-[#B8C4D6]">
                Unesi podatke i nastavi igrati.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                  Email
                </label>

                <input
                  className="w-full rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/70 px-4 py-3 text-[#E0E1DD] outline-none transition placeholder:text-[#778DA9] focus:border-[#778DA9]/55 focus:ring-4 focus:ring-[#778DA9]/10"
                  placeholder="ime@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#B8C4D6]">
                  Lozinka
                </label>

                <input
                  className="w-full rounded-2xl border border-[#778DA9]/20 bg-[#0D1B2A]/70 px-4 py-3 text-[#E0E1DD] outline-none transition placeholder:text-[#778DA9] focus:border-[#778DA9]/55 focus:ring-4 focus:ring-[#778DA9]/10"
                  placeholder="Unesi lozinku"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button className="w-full rounded-2xl bg-[#415A77] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4f6d8f] hover:shadow-lg hover:shadow-black/20 active:translate-y-0">
                Prijavi se
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-[#778DA9]/15 bg-[#0D1B2A]/45 p-4 text-center">
              <p className="text-sm text-[#B8C4D6]">
                Nemaš račun?{" "}
                <Link
                  href="/register"
                  className="font-black text-[#E0E1DD] underline decoration-[#778DA9]/50 underline-offset-4 transition hover:text-white"
                >
                  Registriraj se
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}