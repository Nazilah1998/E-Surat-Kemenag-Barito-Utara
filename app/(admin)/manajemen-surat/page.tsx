import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Settings2 } from "lucide-react";
import { ManajemenSuratManager } from "@/components/admin/manajemen-surat/manajemen-surat-manager";

export default async function ManajemenSuratPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (!user || !superAdminEmail || user.email !== superAdminEmail) {
    redirect("/");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manajemen Surat"
        description="Kelola opsi pilihan pada form surat masuk dan surat keluar"
        icon={Settings2}
      />
      <ManajemenSuratManager />
    </div>
  );
}
