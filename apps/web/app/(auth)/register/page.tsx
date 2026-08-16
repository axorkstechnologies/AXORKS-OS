"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      toast.success("Account created successfully!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background with Ambient Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/Axorks_Office.jpeg"
          alt="Axorks Office Background"
          fill
          priority
          className="object-cover object-center filter brightness-[0.35] contrast-[1.2] scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
      </div>

      {/* Foreground Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-950/85 backdrop-blur-3xl p-8 rounded-3xl border border-white/20 shadow-2xl shadow-black/90 space-y-6">
          <div className="text-center space-y-3">
            <div className="relative w-44 h-14 mx-auto flex items-center justify-center">
              <Image
                src="/images/Axorks_Complete_logo.png"
                alt="Axorks Technologies"
                fill
                priority
                className="object-contain filter drop-shadow-[0_0_12px_rgba(124,58,237,0.5)]"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Create Your Account</h1>
            <p className="text-slate-300 text-xs max-w-xs mx-auto">
              Set up your workspace credentials on Axorks OS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Morgan"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@axorks.com"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 mt-3"
            >
              {loading ? "Creating Account..." : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="text-violet-400 font-semibold hover:text-violet-300 transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
