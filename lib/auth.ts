import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const requireAuth = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    if (typeof window === "undefined") {
      throw new Error("Unauthorized");
    }
    redirect("/login");
  }
  return user;
});

export const isSuperAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user?.email) return false;
  return user.email === process.env.SUPER_ADMIN_EMAIL;
});

export const requireSuperAdmin = cache(async () => {
  const user = await requireAuth();
  if (!user.email || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    throw new Error("Forbidden: only super admin can perform this action");
  }
  return user;
});
