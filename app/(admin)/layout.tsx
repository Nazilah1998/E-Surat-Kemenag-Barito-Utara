import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { db } from "@/lib/db";
import { pengguna } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isSuperAdmin =
    user.email === process.env.SUPER_ADMIN_EMAIL;

  let userName = "Admin";
  if (user) {
    const [dbUser] = await db
      .select({ nama: pengguna.nama })
      .from(pengguna)
      .where(eq(pengguna.id, user.id))
      .limit(1);
    
    if (dbUser) {
      userName = dbUser.nama;
    } else if (isSuperAdmin) {
      userName = "Super Admin";
    }
  }

  return (
    <AdminShell 
      userEmail={user.email || "User"} 
      userName={userName}
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </AdminShell>
  );
}
