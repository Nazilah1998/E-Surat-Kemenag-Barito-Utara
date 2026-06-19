import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { headers } from "next/headers";

export async function createAuditLog({
  adminId,
  action,
  entityType,
  entityId,
  details,
}: {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const headerList = await headers();
    const rawIp = headerList.get("x-forwarded-for") || "";
    const ip = rawIp.split(",")[0]?.trim() || "unknown";

    await db.insert(auditLogs).values({
      adminId,
      action,
      entityType,
      entityId,
      details: details || {},
      ipAddress: ip,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
