import { PrismaClient } from "../generated/client";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  "postgresql://smartisp:smartisp_password@localhost:5432/smartisp_db?schema=public";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export * from "../generated/client";
export { setTenantContext, withTenantContext } from "./rls";
