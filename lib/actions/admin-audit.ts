"use server";

import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function getAuditLogsAction(
  page: number = 1,
  limit: number = 1000
) {
  try {
    const session = await requireAuth();
    if (!session) return { success: false, error: "Unauthorized" };

    const offset = (page - 1) * limit;

    const data = await db
      .select({
        id: auditLogs.id,
        adminId: auditLogs.adminId,
        adminEmail: users.email,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.adminId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: data.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  } catch (error: unknown) {
    console.error("Failed to fetch audit logs:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch logs" };
  }
}
