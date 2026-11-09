import { PrismaClient } from "@prisma/client";

function isPostgresUrl(value: string | undefined): value is string {
  return value !== undefined && /^(postgresql|postgres):\/\//i.test(value);
}

const databaseUrl = isPostgresUrl(process.env.DATABASE_URL)
  ? process.env.DATABASE_URL
  : isPostgresUrl(process.env.DATABASE_URL_UNPOOLED)
    ? process.env.DATABASE_URL_UNPOOLED
    : undefined;

if (
  databaseUrl === process.env.DATABASE_URL_UNPOOLED &&
  !isPostgresUrl(process.env.DATABASE_URL)
) {
  console.warn(
    "DATABASE_URL is not a PostgreSQL URL; using DATABASE_URL_UNPOOLED for Prisma runtime queries.",
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
