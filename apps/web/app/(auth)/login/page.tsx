"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { toast } from "sonner";
import { Lock, User, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res?.requires_2fa) {
        router.push(`/verify-2fa?user_id=${res.user_id}`);
      } else {
        toast.success("Welcome back to Axorks OS");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid username/email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Premium Axorks Office Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/Axorks_Office.jpeg"
          alt="Axorks Office Background"
          fill
          priority
          className="object-cover object-center filter brightness-[0.35] contrast-[1.2] scale-105 transition-transform duration-1000"
        />
        {/* Dark Ambient Gradients for Maximum Visual Comfort */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
      </div>

      {/* Foreground Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-950/85 backdrop-blur-3xl p-8 rounded-3xl border border-white/20 shadow-2xl shadow-black/90 space-y-6">
          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="relative w-48 h-16 mx-auto flex items-center justify-center">
              <Image
                src="/images/Axorks_Complete_logo.png"
                alt="Axorks Technologies Logo"
                fill
                priority
                className="object-contain filter drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]"
              />
            </div>

            <p className="text-slate-300 text-xs max-w-xs mx-auto font-medium">
              Enterprise Operating System for Software Agencies
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username or email address..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-violet-400 hover:text-violet-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? "Authenticating..." : "Sign in to Axorks OS"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Notice Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure Database Verification
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Authorized Personnel Only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
