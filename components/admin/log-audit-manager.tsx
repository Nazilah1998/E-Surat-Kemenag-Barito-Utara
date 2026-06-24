"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Download, Eye, X, Loader2, Trash2 } from "lucide-react";
import { getAuditLogsAction, deleteAuditLogAction, deleteAllAuditLogsAction } from "@/lib/actions/admin-audit";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { ModernSelect } from "@/components/ui/modern-select";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog";

const getPaginationRange = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export function LogAuditManager({
  initialData = [],
  isSuperAdmin = false,
}: {
  initialData?: AuditLog[];
  isSuperAdmin?: boolean;
}) {
  const [items, setItems] = useState<AuditLog[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<AuditLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAuditLogsAction(1, 10000);
      if (res.success) {
        setItems((res.data ?? []) as AuditLog[]);
      } else {
        setFetchError(res.error || "Gagal memuat log");
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await deleteAuditLogAction(deletingId);
      if (res.success) {
        toast.success(res.message || "Berhasil dihapus");
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        toast.error(res.error || "Gagal menghapus");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAll = async () => {
    setSubmitting(true);
    try {
      const res = await deleteAllAuditLogsAction();
      if (res.success) {
        toast.success(res.message || "Semua log berhasil dihapus");
        setShowDeleteAllConfirm(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal menghapus semua log");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };



  const filtered = useMemo(() => {
    let result = items;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.adminEmail?.toLowerCase().includes(q) ||
          item.entityId?.toLowerCase().includes(q) ||
          item.ipAddress?.toLowerCase().includes(q),
      );
    }

    if (filterStartDate) {
      result = result.filter(
        (item) => new Date(item.createdAt) >= new Date(filterStartDate)
      );
    }
    if (filterEndDate) {
      result = result.filter(
        (item) => new Date(item.createdAt) <= new Date(filterEndDate)
      );
    }
    if (filterAction && filterAction !== "all") {
      result = result.filter((item) => item.action === filterAction);
    }
    if (filterEntity && filterEntity !== "all") {
      result = result.filter((item) => item.entityType === filterEntity);
    }

    return result;
  }, [
    items,
    debouncedSearch,
    filterStartDate,
    filterEndDate,
    filterAction,
    filterEntity,
  ]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const exportCSV = () => {
    const headers = [
      "ID",
      "Tanggal/Waktu",
      "Email Admin",
      "Aksi",
      "Tipe Entitas",
      "ID Entitas",
      "Alamat IP",
    ];
    const rows = filtered.map((item) => [
      item.id,
      new Date(item.createdAt).toLocaleString("id-ID"),
      item.adminEmail || item.adminId,
      item.action,
      item.entityType || "",
      item.entityId || "",
      item.ipAddress || "",
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
    a.download = `log-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "UPDATE":
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
      case "DELETE":
        return "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20";
      default:
        return "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10";
    }
  };

  const ACTION_OPTIONS = [
    { value: "all", label: "Semua Aksi" },
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" },
  ];

  const ENTITY_OPTIONS = [
    { value: "all", label: "Semua Entitas" },
    { value: "Surat Masuk", label: "Surat Masuk" },
    { value: "Surat Keluar", label: "Surat Keluar" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari email admin, ID entitas, atau IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
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
          {isSuperAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="ml-auto bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Hapus Semua
            </Button>
          )}
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
            <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-2xl">
              <div className="w-48">
                <ModernDatePicker
                  label="Dari Tanggal"
                  value={filterStartDate}
                  onChange={(v) => {
                    setFilterStartDate(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <ModernDatePicker
                  label="Sampai Tanggal"
                  value={filterEndDate}
                  onChange={(v) => {
                    setFilterEndDate(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <ModernSelect
                  name="actionFilter"
                  options={ACTION_OPTIONS}
                  value={filterAction || "all"}
                  onChange={(v) => {
                    setFilterAction(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <ModernSelect
                  name="entityFilter"
                  options={ENTITY_OPTIONS}
                  value={filterEntity || "all"}
                  onChange={(v) => {
                    setFilterEntity(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              {(filterStartDate || filterEndDate || filterAction || filterEntity) && (
                <button
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setFilterAction("");
                    setFilterEntity("");
                  }}
                  className="self-end px-3 py-2 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
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
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          <span className="font-semibold">{fetchError}</span>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg text-xs font-bold transition-all"
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
        <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-12">No</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Waktu</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Admin</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Aksi & Entitas</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">IP Address</th>
                  <th className="text-center px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-16">Detail</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400 font-semibold">
                      Belum ada log audit
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {new Date(item.createdAt).toLocaleDateString("id-ID")}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          {new Date(item.createdAt).toLocaleTimeString("id-ID")}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.adminEmail || "Sistem"}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {item.adminId.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-extrabold uppercase border rounded-md ${getActionColor(
                              item.action
                            )}`}
                          >
                            {item.action}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {item.entityType}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {item.ipAddress}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                            title="Lihat Data Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setDeletingId(item.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
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
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none"
                >
                  {[10, 25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="text-[10px] font-semibold text-slate-400 ml-2">
                  {filtered.length} total
                </span>
              </div>
              <div className="flex items-center gap-1">
                {getPaginationRange(currentPage, totalPages || 1).map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum as number)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg border transition-all ${
                        currentPage === pageNum
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailItem && (
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
              className="w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detail Log Audit
                </h2>
                <button
                  onClick={() => setDetailItem(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Waktu
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(detailItem.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      IP Address
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {detailItem.ipAddress || "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Admin
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {detailItem.adminEmail || "Sistem"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {detailItem.adminId}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Aksi
                    </p>
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-extrabold uppercase border rounded-lg ${getActionColor(
                        detailItem.action
                      )}`}
                    >
                      {detailItem.action}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Entitas
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {detailItem.entityType}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono break-all">
                      {detailItem.entityId}
                    </p>
                  </div>
                </div>

                {detailItem.details && Object.keys(detailItem.details).length > 0 && (
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Payload / Detail Data
                    </p>
                    <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 overflow-x-auto text-xs font-mono text-slate-700 dark:text-slate-300">
                      <pre>{JSON.stringify(detailItem.details, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 shrink-0">
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                  Tutup
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(v) => {
          setShowDeleteConfirm(v);
          if (!v) setDeletingId(null);
        }}
        title="Hapus Log Audit?"
        description="Log ini akan dihapus secara permanen dari sistem. Anda yakin?"
        cancelLabel="Batal"
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />

      {/* Delete All Confirmation */}
      <AlertDialog
        open={showDeleteAllConfirm}
        onOpenChange={(v) => setShowDeleteAllConfirm(v)}
        title="Hapus Semua Log Audit?"
        description="Tindakan ini akan menghapus SELURUH riwayat aktivitas di Log Audit secara permanen. Tindakan ini tidak dapat dibatalkan. Anda yakin?"
        cancelLabel="Batal"
        confirmLabel="Ya, Hapus Semua"
        loading={submitting}
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}
