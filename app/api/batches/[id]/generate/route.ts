import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateIntelligence } from "@/lib/generate";
import { BatchStatus } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/batches/[id]/generate">) {
  const { id } = await ctx.params;
  const batch = await prisma.reviewBatch.findUnique({
    where: { id },
    include: {
      themes: { orderBy: { rank: "asc" }, take: 5 },
      fee: true,
    },
  });
  if (!batch) return Response.json({ error: "Not found" }, { status: 404 });
  if (batch.themes.length === 0) {
    return Response.json({ error: "Run analysis first" }, { status: 400 });
  }

  const feeConfusion =
    (batch.feeConfusion as { detected?: boolean; feeName?: string | null; explanation?: string | null } | null) ??
    null;

  let result;
  try {
    result = await generateIntelligence(
      batch.name,
      batch.themes.map((t) => ({
        name: t.name,
        count: t.count,
        summary: t.summary ?? t.name,
        quotes: t.sampleQuotes,
      })),
      {
        detected: feeConfusion?.detected ?? false,
        name: feeConfusion?.feeName ?? null,
        explanation: feeConfusion?.explanation ?? null,
      }
    );
  } catch (err) {
    console.error("Generate failed:", err);
    return Response.json(
      {
        error: process.env.LLM_MOCK === "true"
          ? "Generation failed in mock mode"
          : `Generation failed — ${(err as Error).message}`,
      },
      { status: 502 }
    );
  }

  const { pulse, fee, pulseWordCount } = result;

  await prisma.$transaction(async (tx) => {
    await tx.pulse.upsert({
      where: { batchId: id },
      update: {
        summary: pulse.summary,
        observation: pulse.observation,
        actions: pulse.actions,
        topThemes: batch.themes.map((t) => ({ name: t.name, count: t.count, rank: t.rank })),
        wordCount: pulseWordCount,
      },
      create: {
        batchId: id,
        summary: pulse.summary,
        observation: pulse.observation,
        actions: pulse.actions,
        topThemes: batch.themes.map((t) => ({ name: t.name, count: t.count, rank: t.rank })),
        wordCount: pulseWordCount,
      },
    });

    if (fee) {
      await tx.feeExplanation.upsert({
        where: { batchId: id },
        update: {
          feeName: fee.feeName,
          explanation: fee.explanation,
          officialSources: fee.officialSources,
        },
        create: {
          batchId: id,
          feeName: fee.feeName,
          explanation: fee.explanation,
          officialSources: fee.officialSources,
        },
      });
    }

    await tx.reviewBatch.update({
      where: { id },
      data: { status: BatchStatus.generated },
    });
  });

  return Response.json({
    pulse,
    fee,
    pulseWordCount,
    mock: process.env.LLM_MOCK === "true",
  });
}