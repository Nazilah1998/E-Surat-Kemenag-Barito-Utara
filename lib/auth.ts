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
