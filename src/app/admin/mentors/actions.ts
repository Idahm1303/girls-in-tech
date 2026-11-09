"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";
import { sendMentorEmails } from "@/lib/mentor-email";

const reviewSchema = z.object({
  mentorId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "NEEDS_INFO", "SUSPENDED"]),
  note: z.string().trim().max(1000),
});

const decisionMessages = {
  APPROVED: "Your GiT mentor application has been approved. Welcome to the mentor community!",
  REJECTED: "Thank you for applying to mentor with GiT. Unfortunately, your application was not approved.",
  NEEDS_INFO: "A GiT admin needs a little more information. Sign in to your mentor account to review the note and update your application.",
  SUSPENDED: "Your GiT mentor account has been suspended. Please contact GiT administration if you have questions.",
} as const;

export async function reviewMentorApplication(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    mentorId: formData.get("mentorId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) redirect("/admin/mentors?error=invalid");
  if (
    (parsed.data.decision === "REJECTED" ||
      parsed.data.decision === "NEEDS_INFO") &&
    parsed.data.note.length < 5
  ) {
    redirect(`/admin/mentors/${parsed.data.mentorId}?error=note-required`);
  }

  const mentor = await prisma.user.findFirst({
    where: { id: parsed.data.mentorId, role: "MENTOR" },
    select: { id: true, email: true, name: true, mentorProfile: { select: { id: true } } },
  });
  if (!mentor?.mentorProfile) redirect("/admin/mentors?error=not-found");

  await prisma.$transaction([
    prisma.mentorProfile.update({
      where: { id: mentor.mentorProfile.id },
      data: {
        status: parsed.data.decision,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNote: parsed.data.note || null,
        isPublished: parsed.data.decision === "APPROVED",
      },
    }),
    prisma.user.update({
      where: { id: mentor.id },
      data: {
        status:
          parsed.data.decision === "APPROVED"
            ? "APPROVED"
            : parsed.data.decision === "SUSPENDED"
              ? "SUSPENDED"
              : "PENDING",
      },
    }),
    prisma.notification.create({
      data: {
        userId: mentor.id,
        type: "MENTOR_STATUS",
        title: `Mentor application ${parsed.data.decision.toLowerCase().replace("_", " ")}`,
        message: decisionMessages[parsed.data.decision],
      },
    }),
  ]);

  await sendMentorEmails([{
    to: mentor.email,
    subject: `Update on your GiT mentor application`,
    text: `${decisionMessages[parsed.data.decision]}${parsed.data.note ? `\n\nAdmin note: ${parsed.data.note}` : ""}\n\nLimitless minds. Infinite Code.`,
  }]);

  redirect(`/admin/mentors/${mentor.id}?updated=1`);
}
