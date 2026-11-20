"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentMember } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import {
  MENTOR_PROFILE_EXPERTISE,
} from "@/lib/mentor-validation";
import { StorageValidationError, deleteStoredFile, storeMentorPhoto } from "@/lib/storage";
import {
  buildMentorAvailabilityOccurrences,
  formatMentorAvailability,
  MENTOR_TIMEZONE,
  parseMentorLocalDateTime,
} from "@/lib/mentor-schedule";
import { mentorScheduleSchema } from "@/lib/mentor-validation";

const profileSchema = z.object({
  bio: z.string().trim().min(20).max(600),
  availabilityNotes: z.string().trim().max(1000),
  expertise: z.array(z.enum(MENTOR_PROFILE_EXPERTISE)).min(1),
  expertiseOther: z.string().trim().max(120),
});

export async function updateMentorProfile(formData: FormData) {
  const member = await getCurrentMember();
  if (!member || member.role !== "MENTOR") redirect("/login");
  if (member.mentorProfile?.status !== "APPROVED") redirect("/mentor/status");
  const parsed = profileSchema.safeParse({
    bio: formData.get("bio"),
    availabilityNotes: formData.get("availabilityNotes"),
    expertise: formData.getAll("expertise"),
    expertiseOther: formData.get("expertiseOther") ?? "",
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
          expertiseOther: parsed.data.expertiseOther.trim() || null,
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

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: member.id },
    select: {
      id: true,
      sessionLengthMinutes: true,
      minimumNoticeHours: true,
    },
  });
  if (!profile) redirect("/mentor/status");
  const start = parseMentorLocalDateTime(parsed.data.date, parsed.data.startsAt);
  const end = parseMentorLocalDateTime(parsed.data.date, parsed.data.endsAt);
  const earliestStart = new Date(
    Date.now() + profile.minimumNoticeHours * 60 * 60 * 1000,
  );
  if (
    !start ||
    !end ||
    start < earliestStart ||
    end.getTime() - start.getTime() !== profile.sessionLengthMinutes * 60 * 1000
  ) {
    redirect("/mentor?error=invalid-slot");
  }
  const slots = Array.from({ length: parsed.data.repeatWeekly ? 12 : 1 }, (_, index) => {
    const startsAt = new Date(start.getTime() + index * 7 * 24 * 60 * 60 * 1000);
    const endsAt = new Date(end.getTime() + index * 7 * 24 * 60 * 60 * 1000);
    return { mentorProfileId: profile.id, startsAt, endsAt };
  });
  await prisma.availabilitySlot.createMany({ data: slots });
  redirect("/mentor?updated=availability");
}

export async function updateMentorAvailability(formData: FormData) {
  const member = await getCurrentMember();
  if (!member || member.role !== "MENTOR") redirect("/login");
  if (member.mentorProfile?.status !== "APPROVED") redirect("/mentor/status");
  const parsed = mentorScheduleSchema.safeParse({
    availability: formData.getAll("availability"),
    sessionLengthMinutes: formData.get("sessionLengthMinutes"),
    minimumNoticeHours: formData.get("minimumNoticeHours"),
  });
  if (!parsed.success) redirect("/mentor?error=invalid-availability");

  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    const profile = await transaction.mentorProfile.findUnique({
      where: { userId: member.id },
      select: { id: true },
    });
    if (!profile) redirect("/mentor/status");

    await transaction.$queryRaw`
      SELECT "id" FROM "MentorProfile" WHERE "id" = ${profile.id} FOR UPDATE
    `;
    await transaction.mentorProfile.update({
      where: { id: profile.id },
      data: {
        availabilityNotes: formatMentorAvailability(
          parsed.data.availability,
          parsed.data.sessionLengthMinutes,
        ),
        weeklyAvailability: parsed.data.availability,
        sessionLengthMinutes: parsed.data.sessionLengthMinutes,
        minimumNoticeHours: parsed.data.minimumNoticeHours,
        timezone: MENTOR_TIMEZONE,
      },
    });
    await transaction.availabilitySlot.deleteMany({
      where: {
        mentorProfileId: profile.id,
        status: "AVAILABLE",
        startsAt: { gt: now },
      },
    });

    const bookedSlots = await transaction.availabilitySlot.findMany({
      where: {
        mentorProfileId: profile.id,
        status: "BOOKED",
        endsAt: { gt: now },
      },
      select: { startsAt: true, endsAt: true },
    });
    const occurrences = buildMentorAvailabilityOccurrences(
      parsed.data.availability,
      parsed.data.sessionLengthMinutes,
      now,
    ).filter(
      (occurrence) =>
        !bookedSlots.some(
          (booked) =>
            booked.startsAt < occurrence.endsAt &&
            booked.endsAt > occurrence.startsAt,
        ),
    );
    if (occurrences.length) {
      await transaction.availabilitySlot.createMany({
        data: occurrences.map((slot) => ({
          ...slot,
          mentorProfileId: profile.id,
        })),
      });
    }
  });
  redirect("/mentor?updated=availability");
}
