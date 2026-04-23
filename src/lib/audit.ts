import { prisma } from "@/lib/prisma";

interface AuditParams {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}

export async function writeAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    // Audit logging must never break the main flow
  }
}
