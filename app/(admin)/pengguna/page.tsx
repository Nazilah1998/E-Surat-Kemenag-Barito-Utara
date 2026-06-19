import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Users } from "lucide-react";
import { PenggunaManager } from "@/components/admin/pengguna/pengguna-manager";

export default async function PenggunaPage() {
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
        title="Pengguna"
        description="Kelola akun admin surat"
        icon={Users}
      />
      <PenggunaManager superAdminEmail={superAdminEmail} />
    </div>
  );
}
