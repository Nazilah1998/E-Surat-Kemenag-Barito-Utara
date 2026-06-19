"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Loader2,
  KeyRound,
  History,
  ToggleLeft,
  ToggleRight,
  Download,
  X,
  ShieldCheck,
  UserCog,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getPenggunaAction,
  createPenggunaAction,
  updatePenggunaAction,
  resetPasswordPenggunaAction,
  toggleActivePenggunaAction,
  getRiwayatPenggunaAction,
} from "@/lib/actions/admin-pengguna";
import { m, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Pengguna {
  id: string;
  email: string;
  nama: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface RiwayatItem {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  BUAT_PENGGUNA: "Membuat akun pengguna",
  UBAH_PENGGUNA: "Mengubah data pengguna",
  RESET_PASSWORD_PENGGUNA: "Meriset password pengguna",
  AKTIFKAN_PENGGUNA: "Mengaktifkan pengguna",
  NONAKTIFKAN_PENGGUNA: "Menonaktifkan pengguna",
};

export function PenggunaManager({
  superAdminEmail,
}: {
  superAdminEmail: string;
}) {
  const [items, setItems] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama: "",
    isActive: true,
  });

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const [showRiwayat, setShowRiwayat] = useState(false);
  const [riwayatUserName, setRiwayatUserName] = useState("");
  const [riwayatData, setRiwayatData] = useState<RiwayatItem[]>([]);
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getPenggunaAction(1, 10000);
      if (res.success) {
        setItems((res.data ?? []) as Pengguna[]);
      } else {
        setFetchError(res.error || "Gagal memuat data");
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  const filtered = useMemo(() => {
    let result = items;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q),
      );
    }

    if (statusFilter === "active") {
      result = result.filter((item) => item.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((item) => !item.isActive);
    }

    return result;
  }, [items, debouncedSearch, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const openCreate = () => {
    setEditingId(null);
    setFormData({ email: "", password: "", nama: "", isActive: true });
    setShowPassword(false);
    setShowForm(true);
  };

  const openEdit = (item: Pengguna) => {
    setEditingId(item.id);
    setFormData({
      email: item.email,
      password: "",
      nama: item.nama,
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editingId) {
        fd.set("id", editingId);
        fd.set("nama", formData.nama);
        fd.set("isActive", String(formData.isActive));

        const res = await updatePenggunaAction(fd);
        if (res.success) {
          toast.success(res.message || "Berhasil disimpan");
          setShowForm(false);
          fetchData();
        } else {
          toast.error(res.error || "Gagal menyimpan");
        }
      } else {
        fd.set("email", formData.email);
        fd.set("password", formData.password);
        fd.set("nama", formData.nama);

        const res = await createPenggunaAction(fd);
        if (res.success) {
          toast.success(res.message || "Berhasil dibuat");
          setShowForm(false);
          fetchData();
        } else {
          toast.error(res.error || "Gagal membuat");
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await toggleActivePenggunaAction(id);
      if (res.success) {
        toast.success(res.message || "Berhasil");
        fetchData();
      } else {
        toast.error(res.error || "Gagal");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordId) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("id", resetPasswordId);
      fd.set("password", resetPasswordValue);

      const res = await resetPasswordPenggunaAction(fd);
      if (res.success) {
        toast.success(res.message || "Password berhasil direset");
        setShowResetPassword(false);
        setResetPasswordId(null);
        setResetPasswordValue("");
      } else {
        toast.error(res.error || "Gagal mereset password");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const openRiwayat = async (item: Pengguna) => {
    setRiwayatUserName(item.nama);
    setShowRiwayat(true);
    setRiwayatLoading(true);
    setRiwayatData([]);
    try {
      const res = await getRiwayatPenggunaAction(item.id, 1, 100);
      if (res.success) {
        setRiwayatData((res.data ?? []) as RiwayatItem[]);
      } else {
        toast.error(res.error || "Gagal memuat riwayat");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setRiwayatLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Nama",
      "Email",
      "Role",
      "Status",
      "Terakhir Login",
      "Dibuat Pada",
    ];
    const rows = filtered.map((item) => [
      item.nama,
      item.email,
      item.email === superAdminEmail ? "Super Admin" : "Admin Surat",
      item.isActive ? "Aktif" : "Nonaktif",
      item.lastLoginAt
        ? new Date(item.lastLoginAt).toLocaleString("id-ID")
        : "-",
      new Date(item.createdAt).toLocaleString("id-ID"),
    ]);

    const csv = [
      "\uFEFF" + headers.join(","),
      ...rows.map((r) =>
        r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pengguna-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            name="search_pengguna"
            id="search_pengguna"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            autoComplete="new-password"
            spellCheck="false"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <m.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="z-10 relative"
          >
            <div className="flex flex-wrap gap-4 p-4 bg-white border border-slate-200 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ml-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value as "all" | "active" | "inactive",
                    );
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="all">Semua</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="self-end px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 flex items-center justify-between">
          <span className="font-semibold">{fetchError}</span>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold transition-all"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Table */}
      {!loading && !fetchError && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-12">
                    No
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Nama & Email
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Terakhir Login
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-slate-400 font-semibold"
                    >
                      Belum ada data pengguna
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => {
                    const isSuper = item.email === superAdminEmail;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-xs font-bold text-slate-400">
                          {(currentPage - 1) * rowsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-bold text-slate-900">
                            {item.nama}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {item.email}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/50 text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                              <ShieldCheck className="h-3 w-3" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                              <UserCog className="h-3 w-3" />
                              Admin Surat
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                : "bg-red-50 text-red-700 border border-red-200/50"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.isActive ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {item.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-slate-500">
                          {item.lastLoginAt
                            ? new Date(item.lastLoginAt).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {!isSuper && (
                              <button
                                onClick={() => handleToggleActive(item.id)}
                                disabled={submitting}
                                className={`p-1.5 rounded-lg transition-all ${
                                  item.isActive
                                    ? "hover:bg-red-50 text-slate-400 hover:text-red-500"
                                    : "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                                }`}
                                title={
                                  item.isActive ? "Nonaktifkan" : "Aktifkan"
                                }
                              >
                                {item.isActive ? (
                                  <ToggleRight className="h-3.5 w-3.5" />
                                ) : (
                                  <ToggleLeft className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {!isSuper && (
                              <button
                                onClick={() => {
                                  setResetPasswordId(item.id);
                                  setResetPasswordValue("");
                                  setShowResetPassword(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all"
                                title="Reset Password"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openRiwayat(item)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
                              title="Riwayat Aktivitas"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">
                  Baris per halaman:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                >
                  {[10, 25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-semibold text-slate-400 ml-2">
                  {filtered.length} total
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-slate-600">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  {editingId ? "Edit Pengguna" : "Tambah Pengguna"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nama
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Nama lengkap"
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                  />
                </div>

                {!editingId && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Email
                      </label>
                      <input
                        required
                        type="email"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        placeholder="admin@kemenag.go.id"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          required
                          type={showPassword ? "text" : "password"}
                          minLength={6}
                          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                          placeholder="Minimal 6 karakter"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {editingId && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs font-bold text-slate-700">
                      Status Akun
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isActive: !formData.isActive,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          formData.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-500">
                      {formData.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingId ? "Simpan Perubahan" : "Buat Akun"}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetPassword && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <KeyRound className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Reset Password
                    </h2>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Masukkan password baru untuk akun ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetPasswordId(null);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPasswordText ? "text" : "password"}
                      required
                      minLength={6}
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="Minimal 6 karakter"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowResetPasswordText(!showResetPasswordText)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showResetPasswordText ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetPasswordId(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={submitting || !resetPasswordValue}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-amber-200"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Reset Password
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Riwayat Aktivitas Modal */}
      <AnimatePresence>
        {showRiwayat && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <History className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Riwayat Aktivitas
                    </h2>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {riwayatUserName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRiwayat(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                {riwayatLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : riwayatData.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">
                      Belum ada aktivitas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {riwayatData.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">
                            {ACTION_LABELS[log.action] || log.action}
                          </p>
                          {log.details && (
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold text-slate-400">
                              {new Date(log.createdAt).toLocaleString("id-ID")}
                            </span>
                            {log.ipAddress && log.ipAddress !== "unknown" && (
                              <>
                                <span className="text-[10px] text-slate-300">
                                  |
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  IP: {log.ipAddress}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setShowRiwayat(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Tutup
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
