"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowRight, Mail, KeyRound, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
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
            <h1 className="text-xl font-bold tracking-tight text-white">Reset Account Password</h1>
            <p className="text-slate-300 text-xs max-w-xs mx-auto">
              {submitted
                ? "Check your email for recovery instructions"
                : "Enter your registered email to receive password recovery details"}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@axorks.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? "Sending Link..." : "Send Password Reset Link"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                If an active employee account exists for <span className="text-violet-300 font-bold">{email}</span>, a secure recovery email has been dispatched.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-white/10 text-center text-xs text-slate-400">
            Remembered your password?{" "}
            <Link href="/login" className="text-violet-400 font-semibold hover:text-violet-300 transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
