import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type AuditLogInput = {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
};

export async function createAuditLog(input: AuditLogInput) {
  return db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
    },
  });
}
