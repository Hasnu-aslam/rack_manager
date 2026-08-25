"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";

export default function SetPasswordPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.setInitialPassword({
        username_or_email: usernameOrEmail,
        password: password,
      });
      setSuccess("Password set successfully! Redirecting to login page...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to configure password. Ensure the user exists and does not already have a password set.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] font-sans text-gray-200">
      <div className="bg-[#121212] border border-[#1A1A1A] p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Set Initial Password</h1>
          <p className="text-sm text-gray-500">Configure your credentials for first-time login</p>
        </div>

        {error && (
          <div className="bg-[#1a0f0f] border border-[#E63946]/20 text-[#E63946] px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#0f1a0f] border border-green-500/20 text-green-500 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 ml-1">Username or Email</label>
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E63946] focus:border-[#E63946] transition-all font-medium"
              placeholder="e.g. nike_admin or admin@store.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 ml-1">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E63946] focus:border-[#E63946] transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 ml-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#333] text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E63946] focus:border-[#E63946] transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E63946] text-white font-semibold px-4 py-3.5 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 shadow-lg shadow-red-500/20"
          >
            {loading ? "Configuring..." : "Configure Password"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
