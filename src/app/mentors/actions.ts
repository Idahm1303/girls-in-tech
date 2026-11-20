"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentMember } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";

const bookingSchema = z.object({
  availabilitySlotId: z.string().min(1),
});

export async function bookMentorshipSession(formData: FormData) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "STUDENT") redirect("/dashboard");
  if (!member.studentProfile?.profileCompletedAt) redirect("/complete-profile");

  const parsed = bookingSchema.safeParse({
    availabilitySlotId: formData.get("availabilitySlotId"),
  });
  if (!parsed.success) redirect("/mentors?booking=unavailable");

  const booked = await prisma.$transaction(async (transaction) => {
    const requestedSlot = await transaction.availabilitySlot.findUnique({
      where: { id: parsed.data.availabilitySlotId },
      select: {
        id: true,
        mentorProfileId: true,
      },
    });
    if (!requestedSlot) return false;

    await transaction.$queryRaw`
      SELECT "id" FROM "MentorProfile" WHERE "id" = ${requestedSlot.mentorProfileId} FOR UPDATE
    `;
    const mentorProfile = await transaction.mentorProfile.findUnique({
      where: { id: requestedSlot.mentorProfileId },
      select: { minimumNoticeHours: true, status: true, userId: true },
    });
    if (!mentorProfile || mentorProfile.status !== "APPROVED") return false;
    const currentSlot = await transaction.availabilitySlot.findUnique({
      where: { id: requestedSlot.id },
      select: { status: true, startsAt: true, endsAt: true },
    });
    if (!currentSlot || currentSlot.status !== "AVAILABLE") return false;

    const earliestStart = new Date(
      Date.now() + mentorProfile.minimumNoticeHours * 60 * 60 * 1000,
    );
    if (currentSlot.startsAt < earliestStart) return false;

    const overlappingBooking = await transaction.availabilitySlot.findFirst({
      where: {
        mentorProfileId: requestedSlot.mentorProfileId,
        status: "BOOKED",
        startsAt: { lt: currentSlot.endsAt },
        endsAt: { gt: currentSlot.startsAt },
      },
      select: { id: true },
    });
    if (overlappingBooking) return false;

    const updated = await transaction.availabilitySlot.updateMany({
      where: {
        id: requestedSlot.id,
        status: "AVAILABLE",
        startsAt: { gte: earliestStart },
      },
      data: { status: "BOOKED" },
    });
    if (updated.count !== 1) return false;

    await transaction.mentorshipSession.create({
      data: {
        studentId: member.id,
        mentorId: mentorProfile.userId,
        availabilitySlotId: requestedSlot.id,
        status: "ACCEPTED",
      },
    });
    return true;
  });

  redirect(booked ? "/mentors?booking=confirmed" : "/mentors?booking=unavailable");
}
