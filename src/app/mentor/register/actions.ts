"use server";

import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole, AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerMentor } from "@/lib/mentor-service";
import {
  mentorRegistrationSchema,
  mentorExperienceYears,
  type MentorRegistrationFields,
} from "@/lib/mentor-validation";
import { sendMentorEmails } from "@/lib/mentor-email";
import type { FormActionState } from "@/lib/account-validation";

function firstFieldErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

function readForm(formData: FormData) {
  return {
    name: formData.get("name"),
    surname: formData.get("surname"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    company: formData.get("company"),
    industry: formData.get("industry"),
    yearsExperience: formData.get("yearsExperience"),
    qualification: formData.get("qualification"),
    isTutAlumna: formData.get("isTutAlumna"),
    bio: formData.get("bio"),
    linkedinUrl: formData.get("linkedinUrl"),
    expertise: formData.getAll("expertise"),
    sessionFormat: formData.get("sessionFormat"),
    meetingTool: formData.get("meetingTool"),
    campuses: formData.getAll("campuses"),
    maxMentees: formData.get("maxMentees"),
    availability: formData.getAll("availability"),
    motivation: formData.get("motivation"),
    consentPublicProfile: formData.get("consentPublicProfile") === "on",
    consentCodeOfConduct: formData.get("consentCodeOfConduct") === "on",
    consentPrivacy: formData.get("consentPrivacy") === "on",
  };
}

export async function registerMentorAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = mentorRegistrationSchema.safeParse(readForm(formData));
  if (!parsed.success) return { errors: firstFieldErrors(parsed.error) };
  const fields: MentorRegistrationFields = parsed.data;

  const passwordHash = await hash(fields.password, 12);
  const result = await registerMentor(fields, passwordHash, {
    async emailExists(email) {
      return Boolean(
        await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true },
        }),
      );
    },
    async createApplication(input, hashedPassword) {
      await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            name: input.name,
            surname: input.surname,
            email: input.email,
            passwordHash: hashedPassword,
            role: UserRole.MENTOR,
            status: AccountStatus.PENDING,
            consentAt: new Date(),
          },
          select: { id: true },
        });

        await transaction.mentorProfile.create({
          data: {
            userId: user.id,
            phone: input.phone,
            jobTitle: input.jobTitle,
            company: input.company,
            title: input.jobTitle,
            organization: input.company,
            industry: input.industry,
            yearsExperience: mentorExperienceYears(input.yearsExperience),
            qualification: input.qualification,
            isTutAlumna: input.isTutAlumna === "yes",
            bio: input.bio,
            linkedinUrl: input.linkedinUrl || null,
            sessionFormat: input.sessionFormat,
            meetingTool: input.meetingTool,
            campuses: input.campuses,
            maxMentees: input.maxMentees,
            availabilityNotes: input.availability.join(", "),
            motivation: input.motivation,
            consentGivenAt: new Date(),
            status: "PENDING",
            isPublished: false,
            interests: {
              create: input.expertise.map((name) => ({
                interest: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            },
          },
          select: { id: true },
        });

        await transaction.notification.create({
          data: {
            userId: user.id,
            type: "MENTOR_APPLICATION",
            title: "Mentor application received",
            message: "Your application is under review. We will email you when a decision is made.",
          },
        });
        const admins = await transaction.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });
        if (admins.length) {
          await transaction.notification.createMany({
            data: admins.map(({ id }) => ({
              userId: id,
              type: "MENTOR_APPLICATION" as const,
              title: "New mentor application",
              message: `${input.name} ${input.surname} submitted a mentor application for review.`,
            })),
          });
        }
      });
    },
  });

  if (!result.ok) return { errors: { email: result.message } };

  const adminEmail = process.env.GIT_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("Mentor admin email not sent because GIT_ADMIN_EMAIL is not configured.");
  }
  const messages = [
    {
      to: fields.email,
      subject: "We received your GiT mentor application",
      text: `Thank you ${fields.name}. Your application is under review. We will email you once a GiT admin has made a decision.\n\nLimitless minds. Infinite Code.`,
    },
    ...(adminEmail
      ? [{
          to: adminEmail,
          subject: `New GiT mentor application: ${fields.name} ${fields.surname}`,
          text: `${fields.name} ${fields.surname} (${fields.email}) submitted a mentor application. Review it in the GiT admin dashboard.`,
        }]
      : []),
  ];
  await sendMentorEmails(messages);

  (await cookies()).set(
    "git-mentor-application",
    JSON.stringify({ name: fields.name }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/mentor/application-submitted",
      maxAge: 120,
    },
  );
  redirect("/mentor/application-submitted");
}
