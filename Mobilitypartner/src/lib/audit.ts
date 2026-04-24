import { prisma } from '@/lib/prisma';
import { NextApiRequest } from 'next';

interface AuditUser {
  id: number;
  name?: string;
  email?: string;
}

interface AuditOptions {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string | number;
  user?: AuditUser | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  req?: NextApiRequest;
}

function getIp(req?: NextApiRequest): string | null {
  if (!req) return null;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return (req.socket?.remoteAddress) || null;
}

function sanitize(obj: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!obj) return null;
  const clean = { ...obj };
  // Remove sensitive fields
  const sensitiveKeys = ['password', 'passwordHash', 'accessToken', 'refreshToken', 'token', 'secret', 'clientSecret'];
  for (const key of Object.keys(clean)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      clean[key] = '***REDACTED***';
    }
  }
  return clean;
}

/**
 * Pick only changed fields between before and after, keeping both values.
 * For CREATE, returns all after values. For DELETE, returns all before values.
 */
function diffFields(
  action: string,
  before?: Record<string, any> | null,
  after?: Record<string, any> | null
): { before: Record<string, any> | null; after: Record<string, any> | null } {
  if (action === 'CREATE') {
    return { before: null, after: sanitize(after) };
  }
  if (action === 'DELETE') {
    return { before: sanitize(before), after: null };
  }

  // UPDATE: only store changed fields
  if (!before || !after) {
    return { before: sanitize(before), after: sanitize(after) };
  }

  const changedBefore: Record<string, any> = {};
  const changedAfter: Record<string, any> = {};

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    // Skip timestamps and internal fields
    if (['updatedAt', 'createdAt'].includes(key)) continue;

    const bVal = before[key];
    const aVal = after[key];

    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      changedBefore[key] = bVal;
      changedAfter[key] = aVal;
    }
  }

  if (Object.keys(changedAfter).length === 0) return { before: null, after: null };

  return { before: sanitize(changedBefore), after: sanitize(changedAfter) };
}

export async function auditLog(opts: AuditOptions): Promise<void> {
  try {
    const { before: diffBefore, after: diffAfter } = diffFields(opts.action, opts.before, opts.after);

    // Skip if UPDATE with no actual changes
    if (opts.action === 'UPDATE' && !diffBefore && !diffAfter) return;

    await prisma.auditLog.create({
      data: {
        action: opts.action,
        entity: opts.entity,
        entityId: String(opts.entityId),
        userId: opts.user?.id || null,
        userName: opts.user?.name || null,
        userEmail: opts.user?.email || null,
        before: diffBefore || undefined,
        after: diffAfter || undefined,
        ipAddress: getIp(opts.req),
      },
    });
  } catch (error) {
    // Never let audit logging break the main operation
    console.error('Audit log error:', error);
  }
}
