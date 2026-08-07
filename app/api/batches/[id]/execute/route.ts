import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/batches/[id]/execute">) {
  const { id } = await ctx.params;
  const batch = await prisma.reviewBatch.findUnique({
    where: { id },
    include: { approval: true, pulse: true, fee: true },
  });
  if (!batch) return Response.json({ error: "Not found" }, { status: 404 });

  // Approval gate: no explicit Approval row → blocked.
  if (!batch.approval) {
    return Response.json(
      {
        error: "Not approved. Create an explicit Approval record before executing external actions.",
      },
      { status: 403 }
    );
  }

  if (!batch.pulse) {
    return Response.json({ error: "No pulse generated yet" }, { status: 400 });
  }

  // Integrations (Notion + Gmail) are wired in Phases 6-7 behind
  // the `integrations/` interface. Until then execution is a no-op stub.
  return Response.json({
    approved: true,
    executed: [], 
    note: "Integration targets (notion, gmail) not yet configured — approved at " + batch.approval.createdAt.toISOString(),
  });
}