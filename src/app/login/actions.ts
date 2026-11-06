"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/../auth";
import {
  loginSchema,
  type FormActionState,
} from "@/lib/account-validation";
import { postLoginPath } from "@/lib/member-access";
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

export async function loginAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { errors: firstFieldErrors(parsed.error) };

  const user = await prisma.user.findFirst({
    where: { email: { equals: parsed.data.email, mode: "insensitive" } },
    select: {
      email: true,
      passwordHash: true,
      role: true,
      studentProfile: { select: { profileCompletedAt: true } },
    },
  });

  if (
    !user?.passwordHash ||
    !(await compare(parsed.data.password, user.passwordHash))
  ) {
    return { message: "Email or password is incorrect. Please try again." };
  }

  const redirectTo = postLoginPath(
    user.role,
    Boolean(user.studentProfile?.profileCompletedAt),
  );
  await signIn("credentials", {
    email: user.email,
    password: parsed.data.password,
    redirectTo,
  });

  redirect(redirectTo);
}
