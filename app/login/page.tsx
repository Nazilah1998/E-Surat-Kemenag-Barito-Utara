"use client";

import { useState, useCallback, useEffect } from "react";
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

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setTimeout(() => {
        setEmail(savedEmail);
        setRememberMe(true);
      }, 0);
    }
  }, []);

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
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }
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
    [email, password, turnstileToken, router, rememberMe],
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#e6fcf5] to-[#f8fafc]">
      {/* Animated background blobs & particles for light theme */}
      <LoginBgMotion />

      {/* Content wrapper matching E-Arsip max-w-[440px] */}
      <div className="relative z-10 w-full max-w-[440px] px-4 sm:px-0">
        {/* Header / Logo section */}
        <div className="mb-10 sm:mb-12 flex flex-col items-center text-center">
          <m.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-2xl bg-white shadow-[0_10px_40px_-10px_rgba(5,150,105,0.15)] flex items-center justify-center mb-8 p-3 ring-1 ring-emerald-50"
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
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] min-[400px]:text-[11px] sm:text-xs font-bold tracking-widest sm:tracking-[0.2em] text-emerald-600 uppercase text-center leading-tight">
              Kementerian Agama Kabupaten Barito Utara
            </span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 sm:mt-5 text-2xl sm:text-[32px] leading-none font-black text-slate-800 tracking-tight"
          >
            SI MANDAU
          </m.h1>

          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-3 sm:mt-4 space-y-1.5 px-0 sm:px-4"
          >
            <p className="text-[11px] min-[400px]:text-xs sm:text-sm font-medium text-slate-700 leading-relaxed flex flex-col gap-0.5 sm:gap-1">
              <span><span className="font-black text-slate-900">S</span>istem <span className="font-black text-slate-900">I</span>nformasi</span>
              <span><span className="font-black text-slate-900">M</span>anajemen{" "}
              <span className="font-black text-slate-900">A</span>genda{" "}
              <span className="font-black text-slate-900">N</span>askah{" "}
              <span className="font-black text-slate-900">D</span>inas dan{" "}
              <span className="font-black text-slate-900">A</span>dministrasi{" "}
              <span className="font-black text-slate-900">U</span>mum.</span>
            </p>
          </m.div>
        </div>

        {/* Login card */}
        <LoginCardMotion className="w-full">
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

          <form onSubmit={handleLogin} className="space-y-6">
            <m.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Email Admin
              </label>
              <div className="relative flex items-center h-14 bg-[#f0f4ff] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white border border-transparent focus-within:border-emerald-200 transition-all">
                <div className="pl-4 pr-3 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kemenag.go.id"
                  className="w-full h-full pr-4 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative flex items-center h-14 bg-[#f0f4ff] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white border border-transparent focus-within:border-emerald-200 transition-all">
                <div className="pl-4 pr-3 text-slate-400">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-full pr-12 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-emerald-600 transition-colors outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 py-1"
            >
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                  rememberMe ? "bg-emerald-600" : "bg-slate-200"
                }`}
                role="switch"
                aria-checked={rememberMe}
              >
                <span className="sr-only">Ingat Saya</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    rememberMe ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className="text-[11px] font-bold tracking-wider text-slate-600 uppercase cursor-pointer select-none"
                onClick={() => setRememberMe(!rememberMe)}
              >
                Ingat Saya
              </span>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex w-full items-center justify-center py-2"
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
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 px-8 text-sm font-bold tracking-wider text-white uppercase shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-70"
              >
                <span className="relative flex items-center gap-2">
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  )}
                  {loading ? "Memproses..." : "Masuk Ke Dashboard"}
                  {!loading && (
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </span>
              </button>
            </m.div>
          </form>
        </div>
      </LoginCardMotion>
      </div>

      {/* Footer text */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 sm:bottom-10 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase text-center w-full px-4"
      >
        &copy; {new Date().getFullYear()} SI MANDAU KEMENAG BARITO UTARA
      </m.div>
    </div>
  );
}
