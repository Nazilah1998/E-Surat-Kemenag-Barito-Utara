"use server";

import { verifyTurnstileToken } from "@/lib/turnstile";

export async function verifyTurnstileAction(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  return verifyTurnstileToken(token);
}
