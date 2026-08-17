"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/account");
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
        <div className="text-center"><p className="label-muted">Join TechBro</p><h1 className="mt-1 font-display text-2xl font-black tracking-tight text-ink">Create an account</h1><p className="mt-1.5 text-sm text-ink-soft">Manage purchases and project services in one place.</p></div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="label-muted mb-1 block">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field h-10"
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field h-10"
            />
            <p className="mt-1 text-xs text-ink-faint">At least 8 characters</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-11 w-full disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-accent-deep hover:underline">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}
