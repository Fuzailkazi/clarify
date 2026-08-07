import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { BatchStatus } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/batches/[id]/approve">) {
  const { id } = await ctx.params;
  const batch = await prisma.reviewBatch.findUnique({
    where: { id },
    include: { approval: true },
  });
  if (!batch) return Response.json({ error: "Not found" }, { status: 404 });

  if (batch.approval) {
    return Response.json({ error: "Already approved" }, { status: 409 });
  }

  let approvedBy = "demo-user";
  try {
    const body = await req.json();
    if (typeof body.approvedBy === "string" && body.approvedBy.trim()) {
      approvedBy = body.approvedBy.trim().slice(0, 80);
    }
  } catch {
    // body optional
  }

  const approval = await prisma.$transaction(async (tx) => {
    const created = await tx.approval.create({
      data: { batchId: id, approvedBy },
    });
    await tx.reviewBatch.update({
      where: { id },
      data: { status: BatchStatus.awaiting_approval },
    });
    return created;
  });

  return Response.json({ approval }, { status: 201 });
}