import { auth } from "@/../auth";
import { getStoredFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/files/[id]">,
) {
  const session = await auth();
  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const file = await getStoredFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  if (file.kind !== "MENTOR_PROFILE_PHOTO") {
    return new Response("Not found", { status: 404 });
  }

  const isOwner = session.user.id === file.ownerId;
  const isAdmin = session.user.role === "ADMIN";
  const isApprovedMentor =
    file.owner.role === "MENTOR" &&
    file.owner.mentorProfile?.status === "APPROVED";
  if (!isOwner && !isAdmin && !isApprovedMentor) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.data, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
