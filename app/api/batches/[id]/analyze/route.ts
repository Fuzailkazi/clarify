import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { clusterReviews } from "@/lib/analyze";
import { generateStructured } from "@/lib/llm";
import { buildAnalysisPrompt, themeBatchSchema } from "@/prompts/analyze";
import { mockThemeAnalysis } from "@/lib/mock";
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

  const heuristic = clusterReviews(batch.reviews);
  const prompt = buildAnalysisPrompt(batch.reviews, heuristic.themes);
  let data;
  let mock = false;
  try {
    const result = await generateStructured(themeBatchSchema, prompt, mockThemeAnalysis);
    data = result.data;
    mock = result.mock;
  } catch (err) {
    console.error("Analyze failed:", err);
    return Response.json(
      {
        error: process.env.LLM_MOCK === "true"
          ? "Analysis failed in mock mode"
          : `Analysis failed — check GEMINI_API_KEY and network. ${(err as Error).message}`,
      },
      { status: 502 }
    );
  }

  const themes = data.themes
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((t, i) => ({
      batchId: id,
      name: t.name,
      count: t.count,
      rank: i + 1,
      sampleQuotes: t.quotes.slice(0, 3),
    }));

  await prisma.$transaction([
    prisma.theme.deleteMany({ where: { batchId: id } }),
    prisma.theme.createMany({ data: themes }),
    prisma.reviewBatch.update({
      where: { id },
      data: { status: BatchStatus.analyzed },
    }),
  ]);

  return Response.json({
    mock,
    feeConfusion: data.feeConfusion,
    themes: themes.map((t) => ({ name: t.name, count: t.count, rank: t.rank, sampleQuotes: t.sampleQuotes })),
  });
}