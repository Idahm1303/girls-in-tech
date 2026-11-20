"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/member-access";
import {
  ABOUT_PAGE_CONTENT_ID,
  aboutPageContentSchema,
  aboutTeamMemberSchema,
} from "@/lib/about-content";
import { prisma } from "@/lib/prisma";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function saveAboutPageContent(formData: FormData) {
  await requireAdmin();
  const parsed = aboutPageContentSchema.safeParse({
    introduction: formText(formData, "introduction"),
    whatWeDo: formText(formData, "whatWeDo"),
    commitment: formText(formData, "commitment"),
    vision: formText(formData, "vision"),
    mission: formText(formData, "mission"),
  });
  if (!parsed.success) redirect("/admin/content?error=about-invalid");

  await prisma.aboutPageContent.upsert({
    where: { id: ABOUT_PAGE_CONTENT_ID },
    create: { id: ABOUT_PAGE_CONTENT_ID, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/about");
  revalidatePath("/admin/content");
  redirect("/admin/content?updated=about");
}

export async function saveAboutTeamMember(formData: FormData) {
  await requireAdmin();
  const parsed = aboutTeamMemberSchema.safeParse({
    id: formText(formData, "id"),
    name: formText(formData, "name"),
    roleTitle: formText(formData, "roleTitle"),
    imageUrl: formText(formData, "imageUrl"),
  });
  if (!parsed.success) redirect("/admin/content?error=team-invalid");

  const { id, name, roleTitle, imageUrl } = parsed.data;
  const data = { name, roleTitle, imageUrl: imageUrl || null };
  if (id) {
    const result = await prisma.teamMember.updateMany({
      where: { id },
      data,
    });
    if (result.count === 0) redirect("/admin/content?error=team-not-found");
  } else {
    const latest = await prisma.teamMember.aggregate({
      _max: { displayOrder: true },
    });
    await prisma.teamMember.create({
      data: {
        ...data,
        bio: "",
        displayOrder: (latest._max.displayOrder ?? -1) + 1,
      },
    });
  }

  revalidatePath("/about");
  revalidatePath("/admin/content");
  redirect("/admin/content?updated=team");
}
