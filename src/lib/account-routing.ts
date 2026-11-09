import { isApprovedMentor } from "@/lib/mentor-access";

export type MemberRole = "STUDENT" | "MENTOR" | "ADMIN";

export const roleHome = {
  STUDENT: "/dashboard",
  MENTOR: "/mentor",
  ADMIN: "/admin",
} as const satisfies Record<MemberRole, string>;

export function postLoginPath(
  role: MemberRole,
  profileComplete: boolean,
  mentorStatus?: string | null,
): string {
  if (role === "STUDENT" && !profileComplete) return "/complete-profile";
  if (role === "MENTOR" && !isApprovedMentor(mentorStatus)) {
    return "/mentor/status";
  }
  return roleHome[role];
}
