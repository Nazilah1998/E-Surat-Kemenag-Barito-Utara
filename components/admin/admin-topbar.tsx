"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, LogOut, ShieldCheck, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { m, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

function ChangePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Password tidak cocok");
      return;
    }
    if (password.length < 6) {
      toast.error("Minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password berhasil diubah");
      onOpenChange(false);
      setPassword("");
      setConfirm("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Ubah Password</DialogTitle>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Masukkan password baru Anda
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">
                Password Baru
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">
                Konfirmasi Password
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi password"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminTopbar({
  onToggleSidebar,
  userEmail,
}: {
  onToggleSidebar: () => void;
  userEmail: string;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb area */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-slate-600">Panel Admin</span>
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#064e3b] to-[#059669] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {getInitials(userEmail)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{userEmail}</p>
              <p className="text-[10px] font-semibold text-slate-400">Admin</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <m.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50"
              >
                {/* User info */}
                <div className="px-3 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#064e3b] to-[#059669] flex items-center justify-center text-white text-sm font-bold">
                      {getInitials(userEmail)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{userEmail}</p>
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        Admin
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="pt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowChangePassword(true);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                  >
                    <KeyRound className="h-4 w-4 text-slate-400" />
                    Ubah Password
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar Sesi
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </>
  );
}
