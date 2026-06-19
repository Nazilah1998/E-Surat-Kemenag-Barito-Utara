import { getAuditLogsAction } from "@/lib/actions/admin-audit";
import { PageHeader } from "@/components/admin/page-header";
import { LogAuditManager, type AuditLog } from "@/components/admin/log-audit-manager";
import { History } from "lucide-react";

export const metadata = {
  title: "Log Audit | E-Surat",
};

export default async function LogAuditPage() {
  const result = await getAuditLogsAction(1, 10000);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Audit"
        description="Pantau seluruh riwayat aktivitas admin di dalam sistem E-Surat"
        icon={History}
      />
      <LogAuditManager
        initialData={result.success ? (result.data as AuditLog[]) : []}
      />
    </div>
  );
}
