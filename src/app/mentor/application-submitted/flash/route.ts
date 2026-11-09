import { cookies } from "next/headers";
import { z } from "zod";

const flashSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("git-mentor-application")?.value;
  cookieStore.delete("git-mentor-application");
  if (!raw) return Response.json({}, { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    const parsed = flashSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return Response.json({}, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json(parsed.data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return Response.json({}, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
