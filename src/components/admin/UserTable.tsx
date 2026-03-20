"use client";

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Plus, Trash2, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: Date | string;
}

interface UserTableProps {
  initialUsers: UserRow[];
  currentUserId: string;
}

export function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add user form state
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"viewer" | "admin">("viewer");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, email: newEmail, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create user");
        return;
      }
      setUsers((prev) => [...prev, data]);
      setShowAddDialog(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("viewer");
      toast.success(`User ${data.username} created`);
    } catch {
      toast.error("Failed to create user");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to delete user");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteConfirmId(null);
      toast.success(`User ${username} deleted`);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* User list */}
      <GlassCard className="overflow-hidden">
        <div className="divide-y divide-white/5">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center shrink-0">
                  {user.role === "admin" ? (
                    <Shield className="w-4 h-4 text-purple-400" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm">
                    {user.username}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs text-purple-400">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  user.role === "admin"
                    ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                    : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                }`}>
                  {user.role}
                </span>
                <span className="text-xs text-slate-500 hidden sm:block">
                  {formatDate(user.created_at)}
                </span>

                {user.id !== currentUserId && (
                  deleteConfirmId === user.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(user.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add user dialog */}
      {showAddDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowAddDialog(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl">
              <div className="px-6 py-5 border-b border-white/10">
                <h3 className="text-base font-semibold text-white">Add New User</h3>
              </div>
              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "viewer" | "admin")}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="viewer" className="bg-slate-900">Viewer</option>
                    <option value="admin" className="bg-slate-900">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm disabled:opacity-50"
                  >
                    {isAdding ? "Creating..." : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 text-slate-300 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
