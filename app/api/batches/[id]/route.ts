import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/batches/[id]">) {
  const { id } = await ctx.params;
  const batch = await prisma.reviewBatch.findUnique({
    where: { id },
    include: {
      reviews: { orderBy: { createdAt: "asc" } },
      themes: { orderBy: { rank: "asc" } },
      pulse: true,
      fee: true,
      approval: true,
      logs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!batch) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ batch });
}