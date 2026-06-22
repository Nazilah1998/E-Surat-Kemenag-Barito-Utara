import { getSuratKeluarAction } from "@/lib/actions/admin-persuratan";
import { getMasterOptionsAction } from "@/lib/actions/admin-manajemen-surat";
import { PageHeader } from "@/components/admin/page-header";
import {
  SuratKeluarManager,
  type SuratKeluar,
} from "@/components/admin/persuratan/surat-keluar-manager";
import { BADGE_COLOR_MAP } from "@/lib/constants";
import { Send } from "lucide-react";

export const metadata = {
  title: "Surat Keluar",
};

export default async function SuratKeluarPage() {
  const result = await getSuratKeluarAction(1, 5000);
  const [agendaRes, unitKerjaRes] = await Promise.all([
    getMasterOptionsAction("agenda"),
    getMasterOptionsAction("unit_kerja"),
  ]);

  const agendaData = (
    agendaRes.success
      ? (agendaRes.data as { label: string; warna: string }[])
      : []
  ) as { label: string; warna: string }[];
  const unitKerjaData = (
    unitKerjaRes.success
      ? (unitKerjaRes.data as { label: string; warna: string }[])
      : []
  ) as { label: string; warna: string }[];

  const agendaOptions = agendaData.map((o) => o.label);
  const unitKerjaOptions = unitKerjaData.map((o) => o.label);

  const agendaColors: Record<string, string> = {};
  agendaData.forEach((o) => {
    agendaColors[o.label] = o.warna;
  });

  const unitKerjaColors: Record<string, string> = {};
  unitKerjaData.forEach((o) => {
    unitKerjaColors[o.label] = o.warna;
  });

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
        initialAgendaOptions={agendaOptions}
        initialUnitKerjaOptions={unitKerjaOptions}
        agendaColors={agendaColors}
        unitKerjaColors={unitKerjaColors}
      />
    </div>
  );
}
