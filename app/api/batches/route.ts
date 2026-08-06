import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function GET() {
  const batches = await prisma.reviewBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reviews: true } } },
  });
  return Response.json({ batches });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Missing CSV file" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    const content = await file.text();
    const rows = parseCsv(content);
    if (rows.length === 0) {
      return Response.json(
        { error: "No valid reviews found (expected headers: text, rating)" },
        { status: 400 }
      );
    }

    const name = formData.get("name")?.toString().trim() || file.name.replace(/\.csv$/i, "");

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.reviewBatch.create({
        data: { name, sourceFile: file.name },
      });
      await tx.review.createMany({
        data: rows.map((r) => ({
          batchId: created.id,
          text: r.text,
          rating: r.rating,
        })),
      });
      return created;
    });

    return Response.json({ batch, reviewCount: rows.length }, { status: 201 });
  } catch (err) {
    console.error("Upload failed:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}