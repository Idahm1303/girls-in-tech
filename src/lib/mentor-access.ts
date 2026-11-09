export function isApprovedMentor(status: string | null | undefined) {
  return status === "APPROVED";
}

export function canMentorAppearInDirectory(status: string | null | undefined) {
  return isApprovedMentor(status);
}

export function canAccessAdmin(role: string | null | undefined) {
  return role === "ADMIN";
}
