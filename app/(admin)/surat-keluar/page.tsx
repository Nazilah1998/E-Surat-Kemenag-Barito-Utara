import { getSuratKeluarAction } from "@/lib/actions/admin-persuratan";
import { PageHeader } from "@/components/admin/page-header";
import { SuratKeluarManager, type SuratKeluar } from "@/components/admin/persuratan/surat-keluar-manager";
import { Send } from "lucide-react";

export const metadata = {
  title: "Surat Keluar | E-Surat",
};

export default async function SuratKeluarPage() {
  const result = await getSuratKeluarAction(1, 5000);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surat Keluar"
        description="Kelola surat keluar Kemenag Barito Utara"
        icon={Send}
        externalLink="https://docs.google.com/spreadsheets/d/1C8OanScMPs45xNcWHfEldzOjVGLcKQiSL8TZdrxryg8"
      />
      <SuratKeluarManager
        initialData={result.success ? (result.data as SuratKeluar[]) : []}
        initialTotal={result.success ? result.total || 0 : 0}
      />
    </div>
  );
}
