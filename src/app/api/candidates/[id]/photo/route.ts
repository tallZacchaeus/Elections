import { prisma } from "@/lib/db";

/** Public: serve a candidate's photo so voters can see it on the ballot. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { photo: true, photoMime: true },
  });

  if (!candidate?.photo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(candidate.photo), {
    headers: {
      "Content-Type": candidate.photoMime ?? "application/octet-stream",
      // Cache aggressively — callers append ?v=<updatedAt> for cache-busting.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
