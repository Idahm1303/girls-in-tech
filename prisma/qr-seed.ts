import type { PrismaClient } from "@prisma/client";

export async function upsertJoinQrCode(prisma: PrismaClient) {
  return prisma.qrCode.upsert({
    where: { slug: "join" },
    update: {
      name: "Join GiT",
      destinationPath: "/register",
      isActive: true,
    },
    create: {
      name: "Join GiT",
      slug: "join",
      destinationPath: "/register",
      isActive: true,
    },
  });
}
