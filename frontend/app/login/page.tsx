"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    localStorage.setItem(
      "user",
      JSON.stringify(data),
    );

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <form
        onSubmit={handleLogin}
        className="mx-auto max-w-md rounded-2xl bg-zinc-800 p-8 shadow-xl"
      >
        <h1 className="mb-6 text-center text-3xl font-bold">
          Prijava
        </h1>

        <input
          className="mb-4 w-full rounded-lg p-3 text-black"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          className="mb-6 w-full rounded-lg p-3 text-black"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button className="w-full rounded-lg bg-blue-600 p-3 font-bold hover:bg-blue-700">
          Prijavi se
        </button>
      </form>
    </main>
  );
}