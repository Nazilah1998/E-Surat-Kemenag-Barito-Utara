"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  X,
  Loader2,
  Eye,
  Download,
  Upload,
  FileText,
} from "lucide-react";
import {
  getSuratMasukAction,
  saveSuratMasukAction,
  deleteSuratMasukAction,
} from "@/lib/actions/admin-persuratan";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { m, AnimatePresence } from "framer-motion";
import { ModernSelect } from "@/components/ui/modern-select";
import { toTitleCase } from "@/lib/utils";
import { toast } from "sonner";
import { AGENDA_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";

export interface SuratMasuk {
  id: string;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  agenda?: string;
  status?: string;
  lampiran?: string;
}

export function SuratMasukManager({
  initialData = [],
}: {
  initialData?: SuratMasuk[];
  initialTotal?: number;
}) {
  const [items, setItems] = useState<SuratMasuk[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [filterSuratStart, setFilterSuratStart] = useState("");
  const [filterSuratEnd, setFilterSuratEnd] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<SuratMasuk | null>(null);

  const [formData, setFormData] = useState({
    nomor_surat: "",
    tanggal_surat: "",
    tanggal_terima: "",
    asal_surat: "",
    perihal: "",
    agenda: "",
    status: "published",
  });
  const [lampiranFile, setLampiranFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [initialFormJson, setInitialFormJson] = useState("");

  const isFormDirty = useMemo(() => {
    if (!showForm) return false;
    return JSON.stringify(formData) !== initialFormJson;
  }, [formData, showForm, initialFormJson]);

  useEffect(() => {
    if (!showForm || !isFormDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showForm, isFormDirty]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getSuratMasukAction(1, 10000);
      if (res.success) {
        setItems((res.data ?? []) as SuratMasuk[]);
      } else {
        setFetchError(res.error || "Gagal memuat data");
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter & pagination
  const filtered = useMemo(() => {
    let result = items;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.nomor_surat.toLowerCase().includes(q) ||
          item.asal_surat.toLowerCase().includes(q) ||
          item.perihal.toLowerCase().includes(q),
      );
    }

    if (filterSuratStart) {
      result = result.filter((item) => new Date(item.tanggal_surat) >= new Date(filterSuratStart));
    }
    if (filterSuratEnd) {
      result = result.filter((item) => new Date(item.tanggal_surat) <= new Date(filterSuratEnd));
    }

    return result;
  }, [items, debouncedSearch, filterSuratStart, filterSuratEnd]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const openCreate = () => {
    setEditingId(null);
    const defaultData = {
      nomor_surat: "",
      tanggal_surat: "",
      tanggal_terima: "",
      asal_surat: "",
      perihal: "",
      agenda: "",
      status: "published",
    };
    setFormData(defaultData);
    setInitialFormJson(JSON.stringify(defaultData));
    setLampiranFile(null);
    setShowForm(true);
  };

  const openEdit = (item: SuratMasuk) => {
    setEditingId(item.id);
    const editData = {
      nomor_surat: item.nomor_surat,
      tanggal_surat: item.tanggal_surat,
      tanggal_terima: item.tanggal_terima,
      asal_surat: item.asal_surat,
      perihal: item.perihal,
      agenda: item.agenda || "",
      status: item.status || "published",
    };
    setFormData(editData);
    setInitialFormJson(JSON.stringify(editData));
    setLampiranFile(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editingId) fd.set("id", editingId);
      fd.set("nomor_surat", formData.nomor_surat);
      fd.set("tanggal_surat", formData.tanggal_surat);
      fd.set("tanggal_terima", formData.tanggal_terima);
      fd.set("asal_surat", formData.asal_surat);
      fd.set("perihal", formData.perihal);
      fd.set("agenda", formData.agenda);
      fd.set("status", formData.status);
      if (lampiranFile) fd.set("lampiran_file", lampiranFile);

      const res = await saveSuratMasukAction(fd);
      if (res.success) {
        toast.success(res.message || "Berhasil disimpan");
        setShowForm(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal menyimpan");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await deleteSuratMasukAction(deletingId);
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

  const exportCSV = () => {
    const headers = [
      "ID",
      "Nomor Surat",
      "Tanggal Surat",
      "Tanggal Terima",
      "Asal Surat",
      "Perihal",
      "Agenda",
      "Status",
    ];
    const rows = filtered.map((item) => [
      item.id,
      item.nomor_surat,
      item.tanggal_surat,
      item.tanggal_terima,
      item.asal_surat,
      item.perihal,
      item.agenda || "",
      item.status || "",
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
    a.download = `surat-masuk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor, asal, atau perihal..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
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
              <div className="w-48">
                <ModernDatePicker
                  label="Dari Tgl Surat"
                  value={filterSuratStart}
                  onChange={(v) => {
                    setFilterSuratStart(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="w-48">
                <ModernDatePicker
                  label="Sampai Tgl Surat"
                  value={filterSuratEnd}
                  onChange={(v) => {
                    setFilterSuratEnd(v);
                    setCurrentPage(1);
                  }}
                />
              </div>
              {(filterSuratStart || filterSuratEnd) && (
                <button
                  onClick={() => {
                    setFilterSuratStart("");
                    setFilterSuratEnd("");
                  }}
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
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-12">No</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Info Surat</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tgl Surat</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tgl Terima</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Asal & Perihal</th>
                  <th className="text-left px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400 font-semibold">
                      Belum ada data surat masuk
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-900">
                          {item.nomor_surat}
                        </p>
                        {item.agenda && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {item.agenda}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                        {formatDate(item.tanggal_surat)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
                        {formatDate(item.tanggal_terima)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-900">
                          {item.asal_surat}
                        </p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          {item.perihal}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status || "draft"} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            title="Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(item.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
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
                    <option key={n} value={n}>{n}</option>
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
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  {editingId ? "Edit Surat Masuk" : "Tambah Surat Masuk"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nomor Surat
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="B-100/Kk.17.05/1/BA.01/01/2026"
                      value={formData.nomor_surat}
                      onChange={(e) =>
                        setFormData({ ...formData, nomor_surat: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </label>
                    <ModernSelect
                      name="status"
                      options={STATUS_OPTIONS}
                      value={formData.status}
                      onChange={(val) =>
                        setFormData({ ...formData, status: val })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ModernDatePicker
                    required
                    name="tanggal_surat"
                    label="Tanggal Surat"
                    value={formData.tanggal_surat}
                    onChange={(val) =>
                      setFormData({ ...formData, tanggal_surat: val })
                    }
                  />
                  <ModernDatePicker
                    required
                    name="tanggal_terima"
                    label="Tanggal Terima"
                    value={formData.tanggal_terima}
                    onChange={(val) =>
                      setFormData({ ...formData, tanggal_terima: val })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Jenis Agenda
                  </label>
                  <ModernSelect
                    name="agenda"
                    options={AGENDA_OPTIONS}
                    value={formData.agenda}
                    onChange={(val) =>
                      setFormData({ ...formData, agenda: val })
                    }
                    enableSearch
                    searchPlaceholder="Cari agenda..."
                    placeholder="Pilih agenda"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Asal Surat
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Instansi atau perorangan pengirim..."
                    value={formData.asal_surat}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, asal_surat: val });
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setFormData({
                          ...formData,
                          asal_surat: toTitleCase(val),
                        });
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Perihal
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                    placeholder="Perihal surat..."
                    value={formData.perihal}
                    onChange={(e) =>
                      setFormData({ ...formData, perihal: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Lampiran <span className="text-slate-400 font-normal lowercase">(opsional)</span>
                  </label>
                  <label 
                    className={`flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed rounded-xl cursor-pointer transition-all
                      ${isDraggingFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/30'}
                    `}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setLampiranFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <Upload className={`h-4 w-4 ${isDraggingFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className={`text-xs font-semibold ${isDraggingFile ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {lampiranFile
                        ? lampiranFile.name
                        : isDraggingFile ? "Lepaskan file di sini" : "Klik atau seret file ke sini"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) =>
                        setLampiranFile(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
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
                  {editingId ? "Simpan Perubahan" : "Simpan & Terbitkan"}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

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
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  Detail Surat Masuk
                </h2>
                <button
                  onClick={() => setDetailItem(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Nomor Surat
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {detailItem.nomor_surat}
                    </p>
                  </div>
                  <StatusBadge status={detailItem.status || "draft"} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Tanggal Surat
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatDate(detailItem.tanggal_surat)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Tanggal Terima
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatDate(detailItem.tanggal_terima)}
                    </p>
                  </div>
                </div>

                {detailItem.agenda && (
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Jenis Agenda
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {detailItem.agenda}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Asal Surat
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {detailItem.asal_surat}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Perihal
                  </p>
                  <p className="text-sm text-slate-700">{detailItem.perihal}</p>
                </div>

                {detailItem.lampiran && (
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Lampiran
                    </p>
                    <a
                      href={detailItem.lampiran}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all mt-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Lihat Lampiran
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Tutup
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(v) => {
          setShowDeleteConfirm(v);
          if (!v) setDeletingId(null);
        }}
        title="Hapus Surat Masuk?"
        description="Data yang dihapus akan dipindahkan ke arsip. Anda dapat memulihkannya kembali jika diperlukan."
        variant="danger"
        confirmLabel="Hapus"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
