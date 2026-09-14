"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(username, password);
      router.replace(params.get("from") ?? "/");
    } catch {
      setError("Wrong username or password.");
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Stock console</h1>
          <p className="text-sm text-slate-600 mt-1">Sign in to view clinic stock.</p>
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg disabled:opacity-60"
        >
          {pending ? "Signing in" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
