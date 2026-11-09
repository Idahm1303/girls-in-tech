import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, isApprovedMentor } from "@/lib/mentor-access";
import { roleHome } from "@/lib/account-routing";
export { postLoginPath, roleHome } from "@/lib/account-routing";

export async function getCurrentMember() {
  const session = await auth();
  if (!session?.user.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      mentorProfile: {
        select: {
          status: true,
          reviewNote: true,
        },
      },
      studentProfile: {
        select: {
          studentNumber: true,
          campus: true,
          qualification: true,
          profileCompletedAt: true,
        },
      },
    },
  });
}

export async function requireMember() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  return member;
}

export async function requireStudent() {
  const member = await requireMember();
  if (member.role !== "STUDENT") redirect(roleHome[member.role]);
  if (!member.studentProfile?.profileCompletedAt) redirect("/complete-profile");
  return member;
}

export async function requireRole(role: "MENTOR" | "ADMIN") {
  const member = await requireMember();
  if (member.role !== role) redirect(roleHome[member.role]);
  if (
    role === "MENTOR" &&
    !isApprovedMentor(member.mentorProfile?.status)
  ) {
    redirect("/mentor/status");
  }
  return member;
}

export async function requireAdmin() {
  const member = await getCurrentMember();
  if (!member) redirect("/admin/login");
  if (!canAccessAdmin(member.role)) redirect(roleHome[member.role]);
  return member;
}
