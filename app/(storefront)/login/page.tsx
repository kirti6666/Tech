"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push(data.user.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-blue-50/60 to-white px-3 py-8 sm:px-6">
      <div className="w-full max-w-sm rounded-2xl border border-blue-100 bg-white p-4 shadow-lift sm:p-6">
        <div className="text-center"><p className="label-muted">Welcome back</p><h1 className="mt-1 font-display text-2xl font-black tracking-tight text-ink">Log in to TechBro</h1><p className="mt-1.5 text-sm text-ink-soft">Access your purchases, services and account.</p></div>

        <form onSubmit={handleSubmit} className="editorial-form mt-5 space-y-3">
          <div>
            <label className="label-muted mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field h-10"
            />
          </div>
          <div>
            <label className="label-muted mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field h-10"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-11 w-full disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="relative my-4 text-center text-xs text-ink-faint">
          <span className="bg-white px-2 relative z-10">or</span>
          <div className="absolute inset-x-0 top-1/2 border-t" />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/account" })}
          className="btn-secondary h-11 w-full font-semibold"
        >
          Continue with Google
        </button>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-semibold text-accent-deep hover:underline">
            Register
          </a>
        </p>
      </div>
    </main>
  );
}
