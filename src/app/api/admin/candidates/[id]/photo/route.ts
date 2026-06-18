import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPG, PNG, WebP or GIF." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 4 MB)." },
      { status: 413 },
    );
  }

  const exists = await prisma.candidate.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const updated = await prisma.candidate.update({
    where: { id },
    data: { photo: bytes, photoMime: file.type },
    select: { id: true, updatedAt: true },
  });

  return NextResponse.json({
    ok: true,
    photoUrl: `/api/candidates/${id}/photo?v=${updated.updatedAt.getTime()}`,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["ADMIN"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  await prisma.candidate.update({
    where: { id },
    data: { photo: null, photoMime: null },
  });
  return NextResponse.json({ ok: true });
}
