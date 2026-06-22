import { db } from "@/lib/db";
import { suratMasuk, suratKeluar } from "@/lib/db/schema";
import { isNull, count, sql } from "drizzle-orm";
import { PageHeader } from "@/components/admin/page-header";
import { Inbox, Send } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [suratMasukCount] = await db
    .select({ total: count() })
    .from(suratMasuk)
    .where(isNull(suratMasuk.deletedAt));

  const [suratKeluarCount] = await db
    .select({ total: count() })
    .from(suratKeluar)
    .where(isNull(suratKeluar.deletedAt));

  const [suratMasukBulanIni] = await db
    .select({ total: count() })
    .from(suratMasuk)
    .where(
      sql`${isNull(suratMasuk.deletedAt)} AND EXTRACT(MONTH FROM ${suratMasuk.createdAt}) = EXTRACT(MONTH FROM NOW())`,
    );

  const [suratKeluarBulanIni] = await db
    .select({ total: count() })
    .from(suratKeluar)
    .where(
      sql`${isNull(suratKeluar.deletedAt)} AND EXTRACT(MONTH FROM ${suratKeluar.createdAt}) = EXTRACT(MONTH FROM NOW())`,
    );

  const metrics = [
    {
      label: "Surat Masuk",
      value: suratMasukCount?.total || 0,
      subtitle: `${suratMasukBulanIni?.total || 0} bulan ini`,
      icon: Inbox,
      color: "emerald",
    },
    {
      label: "Surat Keluar",
      value: suratKeluarCount?.total || 0,
      subtitle: `${suratKeluarBulanIni?.total || 0} bulan ini`,
      icon: Send,
      color: "violet",
    },
  ];

  const recentSuratMasuk = await db
    .select()
    .from(suratMasuk)
    .where(isNull(suratMasuk.deletedAt))
    .orderBy(sql`${suratMasuk.createdAt} DESC`)
    .limit(5);

  const recentSuratKeluar = await db
    .select()
    .from(suratKeluar)
    .where(isNull(suratKeluar.deletedAt))
    .orderBy(sql`${suratKeluar.createdAt} DESC`)
    .limit(5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan surat masuk dan surat keluar"
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="group rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1d24] p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div
                className={`h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${
                  m.color === "emerald"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100/50 dark:border-emerald-500/20"
                    : "bg-violet-50 dark:bg-violet-500/10 text-violet-600 border-violet-100/50 dark:border-violet-500/20"
                }`}
              >
                <m.icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div>
              <p className="text-[9px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                {m.label}
              </p>
              <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {m.value}
              </p>
            </div>
            <div className="mt-3 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  m.color === "emerald" ? "bg-emerald-500" : "bg-violet-500"
                }`}
                style={{ width: `${Math.min(100, (m.value / 100) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">{m.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Recent Letters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Surat Masuk */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#1a1d24] shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Surat Masuk Terbaru</h3>
            </div>
            <Link href="/surat-masuk" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
            {recentSuratMasuk.length > 0 ? (
              recentSuratMasuk.map((surat) => (
                <div key={surat.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{surat.perihal}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] font-medium text-slate-500">{surat.asalSurat}</p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {new Date(surat.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs font-medium text-slate-400">Belum ada surat masuk</p>
              </div>
            )}
          </div>
        </div>

        {/* Surat Keluar */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#1a1d24] shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-violet-600 dark:text-violet-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Surat Keluar Terbaru</h3>
            </div>
            <Link href="/surat-keluar" className="text-[10px] font-bold text-violet-600 dark:text-violet-500 hover:text-violet-700 dark:hover:text-violet-400">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
            {recentSuratKeluar.length > 0 ? (
              recentSuratKeluar.map((surat) => (
                <div key={surat.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{surat.perihal}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] font-medium text-slate-500">{surat.tujuanSurat}</p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {new Date(surat.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs font-medium text-slate-400">Belum ada surat keluar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
