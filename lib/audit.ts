import { prisma } from "./prisma";

export async function createAuditLog(params: {
  action: string;
  entity: string;
  entityId: string;
  organizationId: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      organizationId: params.organizationId,
      userId: params.userId,
      metadata: (params.metadata ?? {}) as Record<string, string>,
    },
  });
}
