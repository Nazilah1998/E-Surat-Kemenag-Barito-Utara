"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { verifyTurnstileAction } from "@/lib/actions/auth/login-helper";
import { LoginTurnstile } from "@/components/auth/_components/login-turnstile";
import { ErrorBoundary } from "@/components/auth/error-boundary";
import { LoginCardMotion, LoginBgMotion } from "@/components/auth/login-card";
import { Loader2, Mail, Key, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const mounted = true;
  const [error, setError] = useState("");

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!turnstileToken) {
        setError("Verifikasi keamanan diperlukan.");
        return;
      }

      setLoading(true);

      try {
        const verify = await verifyTurnstileAction(turnstileToken);
        if (!verify.success) {
          setError(verify.error || "Verifikasi keamanan gagal.");
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
        } else {
          toast.success("Berhasil masuk");
          router.push("/");
          router.refresh();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    },
    [email, password, turnstileToken, router],
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#e6fcf5] to-[#f8fafc]">
      {/* Animated background blobs & particles for light theme */}
      <LoginBgMotion />

      {/* Header / Logo section */}
      <div className="text-center mb-8 relative z-10 flex flex-col items-center">
        <m.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-[84px] h-[84px] rounded-[1.5rem] bg-white shadow-[0_10px_40px_-10px_rgba(5,150,105,0.15)] flex items-center justify-center mb-6 p-4 ring-1 ring-emerald-50"
        >
          <div className="relative w-full h-full">
            <Image
              src="/kemenag.svg"
              alt="Logo Kemenag"
              fill
              className="object-contain"
              priority
            />
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2 text-[10px] font-black text-emerald-600 tracking-[0.2em] mb-3"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          PORTAL INTERNAL
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[28px] sm:text-[32px] leading-none font-black text-slate-800 tracking-tight mb-2"
        >
          E-SURAT KEMENAG
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-widest uppercase px-4 text-center"
        >
          Kementerian Agama Kabupaten Barito Utara
        </m.p>
      </div>

      {/* Login card */}
      <LoginCardMotion className="relative z-10 w-full max-w-[440px] px-4 sm:px-0">
        <div className="rounded-[2.5rem] bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-100/50 p-8 sm:p-10 border border-white">
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <m.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-6 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl"
              >
                {error}
              </m.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <m.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-2">
                Email Admin
              </label>
              <div className="relative flex items-center bg-[#f0f4ff] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white border border-transparent focus-within:border-emerald-200 transition-all">
                <div className="pl-4 pr-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kemenag.go.id"
                  className="w-full py-4 pr-4 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-2">
                Password
              </label>
              <div className="relative flex items-center bg-[#f0f4ff] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white border border-transparent focus-within:border-emerald-200 transition-all">
                <div className="pl-4 pr-3 text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-4 pr-12 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-emerald-600 transition-colors outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 pt-1 pb-1 ml-1"
            >
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${
                  rememberMe ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                    rememberMe ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-[11px] font-bold text-slate-500 tracking-wider">
                INGAT SAYA
              </span>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center py-2"
            >
              <ErrorBoundary>
                <LoginTurnstile
                  mounted={mounted}
                  onTokenChange={setTurnstileToken}
                />
              </ErrorBoundary>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 mt-2 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl text-sm font-extrabold transition-all shadow-lg shadow-emerald-500/30 uppercase tracking-wide disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Masuk Ke Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </m.div>
          </form>
        </div>
      </LoginCardMotion>

      {/* Footer text */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 sm:bottom-10 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase text-center w-full px-4"
      >
        © 2026 E-SURAT KEMENAG BARITO UTARA
      </m.div>
    </div>
  );
}
