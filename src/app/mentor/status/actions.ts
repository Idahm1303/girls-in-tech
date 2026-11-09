"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentMember } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import {
  deleteStoredFile,
  StorageValidationError,
  storeMentorPhoto,
} from "@/lib/storage";

const updateSchema = z.object({
  jobTitle: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(160),
  bio: z.string().trim().min(20).max(600),
  motivation: z.string().trim().min(10).max(500),
});

export async function resubmitMentorApplication(formData: FormData) {
  const member = await getCurrentMember();
  if (!member || member.role !== "MENTOR") redirect("/login");
  if (member.mentorProfile?.status !== "NEEDS_INFO") redirect("/mentor/status");

  const parsed = updateSchema.safeParse({
    jobTitle: formData.get("jobTitle"),
    company: formData.get("company"),
    bio: formData.get("bio"),
    motivation: formData.get("motivation"),
  });
  if (!parsed.success) redirect("/mentor/status?error=invalid");

  await prisma.$transaction([
    prisma.mentorProfile.update({
      where: { userId: member.id },
      data: {
        ...parsed.data,
        title: parsed.data.jobTitle,
        organization: parsed.data.company,
        status: "PENDING",
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
        isPublished: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: member.id,
        type: "MENTOR_APPLICATION",
        title: "Application resubmitted",
        message: "Your updated mentor application is under review.",
      },
    }),
  ]);
  redirect("/mentor/status");
}

export async function uploadOwnMentorPhoto(formData: FormData) {
  const member = await getCurrentMember();
  if (!member || member.role !== "MENTOR") redirect("/login");
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    redirect("/mentor/status?error=choose-photo");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.mentorProfile.findUniqueOrThrow({
        where: { userId: member.id },
        select: { photoFileId: true },
      });
      const photoFileId = await storeMentorPhoto(transaction, member.id, photo);
      await transaction.mentorProfile.update({
        where: { userId: member.id },
        data: { photoFileId },
      });
      if (current.photoFileId) {
        await deleteStoredFile(transaction, current.photoFileId, member.id);
      }
    });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      redirect(`/mentor/status?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect("/mentor/status?updated=photo");
}
