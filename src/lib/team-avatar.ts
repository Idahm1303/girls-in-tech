export function getTeamMemberInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
