"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentMember } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import {
  MENTOR_EXPERTISE,
} from "@/lib/mentor-validation";
import { StorageValidationError, deleteStoredFile, storeMentorPhoto } from "@/lib/storage";

const profileSchema = z.object({
  bio: z.string().trim().min(20).max(600),
  availabilityNotes: z.string().trim().max(1000),
  expertise: z.array(z.enum(MENTOR_EXPERTISE)).min(1),
});

export async function updateMentorProfile(formData: FormData) {
  const member = await getCurrentMember();
  if (!member || member.role !== "MENTOR") redirect("/login");
  if (member.mentorProfile?.status !== "APPROVED") redirect("/mentor/status");
  const parsed = profileSchema.safeParse({
    bio: formData.get("bio"),
    availabilityNotes: formData.get("availabilityNotes"),
    expertise: formData.getAll("expertise"),
  });
  if (!parsed.success) redirect("/mentor?error=invalid-profile");

  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size > 0
    ? photoEntry
    : null;

  try {
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.mentorProfile.findUniqueOrThrow({
        where: { userId: member.id },
        select: { id: true, photoFileId: true },
      });
      let photoFileId = current.photoFileId;
      if (photo) {
        photoFileId = await storeMentorPhoto(transaction, member.id, photo);
      }

      const interests = await Promise.all(
        parsed.data.expertise.map((name) =>
          transaction.interest.upsert({
            where: { name },
            update: {},
            create: { name },
            select: { id: true },
          }),
        ),
      );
      await transaction.mentorInterest.deleteMany({
        where: { mentorProfileId: current.id },
      });
      await transaction.mentorInterest.createMany({
        data: interests.map(({ id }) => ({
          mentorProfileId: current.id,
          interestId: id,
        })),
      });
      await transaction.mentorProfile.update({
        where: { id: current.id },
        data: {
          bio: parsed.data.bio,
          availabilityNotes: parsed.data.availabilityNotes,
          photoFileId,
        },
      });
      if (photo && current.photoFileId) {
        await deleteStoredFile(transaction, current.photoFileId, member.id);
      }
    });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      redirect(`/mentor?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }
  redirect("/mentor?updated=profile");
}

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/),
  repeatWeekly: z.boolean(),
});

export async function addMentorAvailability(formData: FormData) {
  const member = await getCurrentMember();
  if (!member || member.role !== "MENTOR") redirect("/login");
  if (member.mentorProfile?.status !== "APPROVED") redirect("/mentor/status");
  const parsed = slotSchema.safeParse({
    date: formData.get("date"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    repeatWeekly: formData.get("repeatWeekly") === "on",
  });
  if (!parsed.success) redirect("/mentor?error=invalid-slot");

  const start = new Date(`${parsed.data.date}T${parsed.data.startsAt}:00`);
  const end = new Date(`${parsed.data.date}T${parsed.data.endsAt}:00`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start <= new Date() ||
    end <= start
  ) {
    redirect("/mentor?error=invalid-slot");
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: member.id },
    select: { id: true },
  });
  if (!profile) redirect("/mentor/status");
  const slots = Array.from({ length: parsed.data.repeatWeekly ? 12 : 1 }, (_, index) => {
    const startsAt = new Date(start);
    const endsAt = new Date(end);
    startsAt.setDate(startsAt.getDate() + index * 7);
    endsAt.setDate(endsAt.getDate() + index * 7);
    return { mentorProfileId: profile.id, startsAt, endsAt };
  });
  await prisma.availabilitySlot.createMany({ data: slots });
  redirect("/mentor?updated=availability");
}
