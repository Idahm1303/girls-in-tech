export type MemberRole = "STUDENT" | "MENTOR" | "ADMIN";

export const roleHome = {
  STUDENT: "/dashboard",
  MENTOR: "/mentor",
  ADMIN: "/admin",
} as const satisfies Record<MemberRole, string>;

export function postLoginPath(
  role: MemberRole,
  profileComplete: boolean,
): string {
  if (role === "STUDENT" && !profileComplete) return "/complete-profile";
  return roleHome[role];
}
