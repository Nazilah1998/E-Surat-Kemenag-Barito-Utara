"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, Send, History, type LucideIcon, ShieldCheck, ChevronRight } from "lucide-react";
import { SystemHealthBadge } from "@/components/admin/system-health-badge";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, group: "Utama" },
  { label: "Surat Masuk", href: "/surat-masuk", icon: Inbox, group: "Tata Naskah" },
  { label: "Surat Keluar", href: "/surat-keluar", icon: Send, group: "Tata Naskah" },
  { label: "Log Audit", href: "/log-audit", icon: History, group: "Sistem" },
];

const GROUP_ORDER = ["Utama", "Tata Naskah", "Sistem"];

export function AdminSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: NAV_ITEMS.filter((item) => item.group === group),
  }));

  return (
    <div
      className={`flex flex-col h-full bg-[#0f1117] transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#064e3b] to-[#059669] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/90 truncate">E-Surat</p>
            <p className="text-[10px] font-semibold text-white/30 truncate leading-tight">
              Kemenag Barito Utara
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6 custom-scrollbar">
        {grouped.map(({ group, items }) =>
          items.length > 0 ? (
            <div key={group}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-extrabold text-white/20 uppercase tracking-widest">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group/link flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-emerald-400" : "text-white/40 group-hover/link:text-white/60"
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {isActive && (
                            <ChevronRight className="h-3.5 w-3.5 ml-auto text-emerald-400 shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null,
        )}
      </nav>

      {/* System health */}
      <SystemHealthBadge />
    </div>
  );
}
