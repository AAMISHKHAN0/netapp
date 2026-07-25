import { Prisma, PrismaClient } from "@prisma/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateTenantId(tenantId: string): void {
  if (!UUID_REGEX.test(tenantId)) {
    throw new Error(`Invalid tenant ID format: expected valid UUID, got '${tenantId}'`);
  }
}

/**
 * Executes a callback within a Prisma interactive transaction where `set_config('app.current_tenant_id', tenantId, true)`
 * is parameterized and scoped exclusively to that transaction batch (`true` = transaction local).
 *
 * This pattern ensures Row-Level Security (RLS) remains strictly isolated and SQL-injection safe
 * even when using Supabase transaction mode connection pooling (Supavisor / PgBouncer on port 6543).
 */
export async function withTenantContext<T>(
  prisma: PrismaClient,
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  validateTenantId(tenantId);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true);`;
    return fn(tx);
  });
}

/**
 * Parameterized helper to set tenant context in non-pooled environments or direct raw queries.
 */
export async function setTenantContext(prisma: PrismaClient, tenantId: string): Promise<void> {
  validateTenantId(tenantId);
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true);`;
}
