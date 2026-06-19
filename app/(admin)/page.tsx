import { db } from "@/lib/db";
import { suratMasuk, suratKeluar } from "@/lib/db/schema";
import { isNull, count, sql } from "drizzle-orm";
import { PageHeader } from "@/components/admin/page-header";
import { Inbox, Send, ChevronRight } from "lucide-react";
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

  const quickLinks = [
    { label: "Buat Surat Masuk", href: "/surat-masuk", icon: Inbox },
    { label: "Buat Surat Keluar", href: "/surat-keluar", icon: Send },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan surat masuk dan surat keluar"
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                  m.color === "emerald"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                    : "bg-violet-50 text-violet-600 border-violet-100/50"
                }`}
              >
                <m.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              {m.label}
            </p>
            <p className="text-3xl font-black text-slate-900 tabular-nums">
              {m.value}
            </p>
            <div className="mt-3 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
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

      {/* Quick Links */}
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Akses Cepat</h3>
        </div>
        <div className="p-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition-all group/link"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <link.icon className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">{link.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover/link:text-slate-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
