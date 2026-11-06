"use server";

import { redirect } from "next/navigation";
import {
  studentProfileSchema,
  type FormActionState,
} from "@/lib/account-validation";
import {
  completeStudentProfile,
} from "@/lib/member-service";
import { getCurrentMember, roleHome } from "@/lib/member-access";
import { prisma } from "@/lib/prisma";

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

export async function completeProfileAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role !== "STUDENT") redirect(roleHome[member.role]);
  if (member.studentProfile?.profileCompletedAt) redirect("/dashboard");

  const parsed = studentProfileSchema.safeParse({
    studentNumber: formData.get("studentNumber"),
    campus: formData.get("campus"),
    qualification: formData.get("qualification"),
  });

  if (!parsed.success) return { errors: firstFieldErrors(parsed.error) };

  const result = await completeStudentProfile(member.id, parsed.data, {
    async studentNumberExists(studentNumber, exceptUserId) {
      return Boolean(
        await prisma.studentProfile.findFirst({
          where: { studentNumber, userId: { not: exceptUserId } },
          select: { id: true },
        }),
      );
    },
    async updateStudentProfile(userId, input) {
      await prisma.studentProfile.upsert({
        where: { userId },
        create: { userId, ...input },
        update: input,
      });
    },
  });

  if (!result.ok) {
    return { errors: { studentNumber: result.message } };
  }

  redirect("/dashboard");
}
