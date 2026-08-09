import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateStructured } from "@/lib/llm";
import { askSchema, buildAskPrompt } from "@/prompts/ask";
import { mockAskReview } from "@/lib/mock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/batches/[id]/ask">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question) return Response.json({ error: "Ask a question first" }, { status: 400 });
  if (question.length > 500) {
    return Response.json({ error: "Question too long (max 500 characters)" }, { status: 400 });
  }

  const batch = await prisma.reviewBatch.findUnique({
    where: { id },
    include: { reviews: { select: { text: true, rating: true } } },
  });
  if (!batch) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    const { data, mock } = await generateStructured(
      askSchema,
      buildAskPrompt(question, batch.reviews),
      mockAskReview
    );
    return Response.json({ answer: data.answer, mock, reviewCount: batch.reviews.length });
  } catch (err) {
    console.error("Ask failed:", err);
    return Response.json(
      {
        error: process.env.LLM_MOCK === "true"
          ? "Question failed in mock mode"
          : `Question failed — ${(err as Error).message}`,
      },
      { status: 502 }
    );
  }
}
