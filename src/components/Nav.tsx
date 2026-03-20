import Link from "next/link";
import { getSession } from "@/lib/session";
import { Briefcase, Settings, Shield, LogOut } from "lucide-react";
import { NavSignOut } from "./NavSignOut";

export async function Nav() {
  const session = await getSession();
  if (!session) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white hidden sm:block">Job Helper</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:block">Dashboard</span>
          </Link>

          <Link
            href="/sync-settings"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:block">Sync</span>
          </Link>

          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:block">Admin</span>
            </Link>
          )}

          <div className="w-px h-5 bg-white/10 mx-1" />

          <div className="flex items-center gap-2 px-3 py-2 text-slate-400 text-sm">
            <span className="hidden sm:block">{session.user.username}</span>
          </div>

          <NavSignOut />
        </div>
      </div>
    </nav>
  );
}
