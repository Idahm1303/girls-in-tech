import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { hash } from "bcryptjs";
import { z } from "zod";

loadEnvConfig(process.cwd());

const adminInputSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(1).max(120).default("GiT Administrator"),
});

async function main() {
  const parsed = adminInputSchema.safeParse({
    email: process.env.GIT_ADMIN_EMAIL,
    password: process.env.GIT_ADMIN_PASSWORD,
    name: process.env.GIT_ADMIN_NAME || undefined,
  });
  if (!parsed.success) {
    throw new Error(
      "Set a valid GIT_ADMIN_EMAIL and a 12 to 128 character GIT_ADMIN_PASSWORD; GIT_ADMIN_NAME is optional.",
    );
  }

  const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED;
  if (!directUrl) {
    throw new Error("Set DIRECT_URL to the direct PostgreSQL connection string.");
  }

  const prisma = new PrismaClient({ datasourceUrl: directUrl });
  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, role: true },
    });
    if (existing && existing.role !== UserRole.ADMIN) {
      throw new Error(
        "That email belongs to a non-admin account. Choose a separate admin email.",
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          passwordHash,
          status: AccountStatus.APPROVED,
          emailVerifiedAt: new Date(),
          consentAt: new Date(),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: UserRole.ADMIN,
          status: AccountStatus.APPROVED,
          emailVerifiedAt: new Date(),
          consentAt: new Date(),
        },
      });
    }
    console.log(`Administrator account is ready for ${parsed.data.email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Admin account provisioning failed:", error);
  process.exitCode = 1;
});
