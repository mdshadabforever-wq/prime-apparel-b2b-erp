"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Phone, AlertCircle, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login process failed.");
      }

      if (data.user.role === "BUYER") {
        router.push("/catalog");
      } else {
        router.push("/admin");
      }
      
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Mobile number ya password galat hai. Check karein.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 font-sans text-slate-200 flex flex-col items-center justify-center min-h-[90vh] px-4 w-full relative overflow-hidden">
      {/* Background blur rings */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gold/5 blur-[80px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-[420px] flex flex-col gap-8 animate-scale-in">
        {/* Title */}
        <div className="text-center flex flex-col items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 font-outfit font-black text-white text-lg tracking-tight mb-2 hover:opacity-90 transition-opacity">
            <Sparkles className="w-5 h-5 text-gold animate-pulse-glow" />
            <span>PRIME ERP</span>
          </Link>
          <h2 className="font-outfit text-2xl font-extrabold text-white tracking-tight leading-none">Welcome back</h2>
          <p className="text-slate-500 text-xs mt-1 leading-normal">Unified login for verified Buyers & internal Staff</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl flex flex-col gap-6 relative">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">WhatsApp Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-855 focus:border-gold focus:ring-1 focus:ring-gold outline-none text-xs transition-all text-white font-medium"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl text-center text-xs transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-white/5"
            >
              <span>{isSubmitting ? "Signing in..." : "Secure Login"}</span>
              {!isSubmitting && <ArrowRight className="w-3.5 h-3.5 text-slate-950" />}
            </button>
          </form>

          {/* Footnote */}
          <div className="pt-4 border-t border-slate-900 text-center text-[11px] text-slate-500 flex flex-col gap-1.5 font-medium">
            <p>New Buyer? <Link href="/register" className="text-gold hover:underline font-bold">Register B2B Account</Link></p>
            <span className="text-[10px] text-slate-600 font-normal leading-normal">
              Demo credentials:<br />
              Staff: 919999999999 / admin123<br />
              Buyer: 919876543210 / buyer123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
