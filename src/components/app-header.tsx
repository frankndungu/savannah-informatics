"use client";

import { useAuth } from "@/lib/auth-context";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold">Stock console</h1>
          <p className="text-xs text-slate-500">Main Clinic</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-700 hidden sm:inline">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={logout}
            className="text-sm px-2.5 py-1.5 rounded hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
