"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function NavSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
      aria-label="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
