import type { PrismaClient } from "@prisma/client";
import { teamRoster } from "../src/lib/team-roster";

function teamId(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `git-team-${slug}`;
}

export async function upsertTeamRoster(prisma: PrismaClient) {
  for (const [displayOrder, member] of teamRoster.entries()) {
    const existing = await prisma.teamMember.findFirst({
      where: { name: member.name },
      select: { id: true, imageUrl: true },
    });
    const id = existing?.id ?? teamId(member.name);
    const imageUrl =
      existing?.imageUrl?.startsWith("https://") ? existing.imageUrl : member.imageSrc;
    await prisma.teamMember.upsert({
      where: { id },
      update: {
        name: member.name,
        roleTitle: member.roleTitle,
        bio: member.bio,
        imageUrl,
        displayOrder,
      },
      create: {
        id,
        name: member.name,
        roleTitle: member.roleTitle,
        bio: member.bio,
        imageUrl: member.imageSrc,
        displayOrder,
      },
    });
  }
}
