import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { clusterReviews } from "@/lib/analyze";
import { BatchStatus } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/batches/[id]/analyze">) {
  const { id } = await ctx.params;
  const batch = await prisma.reviewBatch.findUnique({
    where: { id },
    include: {
      reviews: { select: { id: true, text: true, rating: true } },
      themes: true,
    },
  });
  if (!batch) return Response.json({ error: "Not found" }, { status: 404 });

  if (batch.themes.length > 0) {
    await prisma.theme.deleteMany({ where: { batchId: id } });
  }

  const { themes } = clusterReviews(batch.reviews);

  await prisma.$transaction([
    prisma.theme.createMany({
      data: themes.map((t, i) => ({
        batchId: id,
        name: t.name,
        count: t.count,
        rank: i + 1,
        sampleQuotes: t.sampleQuotes,
      })),
    }),
    prisma.reviewBatch.update({
      where: { id },
      data: { status: BatchStatus.themed },
    }),
  ]);

  return Response.json({ themes });
}