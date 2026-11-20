import type { PrismaClient } from "@prisma/client";

export async function upsertDefaultQrCode(prisma: PrismaClient) {
  return prisma.qrCode.upsert({
    where: { slug: "main" },
    update: {},
    create: {
      name: "Main QR",
      slug: "main",
      destinationPath: "/",
      isActive: true,
    },
  });
}
