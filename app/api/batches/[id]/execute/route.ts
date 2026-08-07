import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getIntegration, getIntegrationMode } from "@/integrations";
import {
  IntegrationStatus,
  IntegrationTarget,
  BatchStatus,
} from "@/lib/generated/prisma/enums";

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

  const pulse = {
    summary: batch.pulse.summary,
    observation: batch.pulse.observation,
    actions: (batch.pulse.actions as string[]) ?? [],
    topThemes: (batch.pulse.topThemes as { name: string; count: number; rank: number }[]) ?? [],
    wordCount: batch.pulse.wordCount,
  };
  const fee = batch.fee
    ? {
        feeName: batch.fee.feeName,
        explanation: batch.fee.explanation,
        officialSources: (batch.fee.officialSources as { title: string; url: string }[]) ?? [],
      }
    : null;

  const integration = getIntegration();
  const mode = getIntegrationMode();
  const results: {
    target: string;
    skipped?: boolean;
    ok?: boolean;
    externalId?: string | null;
    error?: string | null;
  }[] = [];

  async function runTarget(
    target: IntegrationTarget,
    fn: () => Promise<{ ok: boolean; externalId?: string; error?: string }>
  ): Promise<void> {
    // Idempotency: one successful log per (batch, target).
    const existing = await prisma.integrationLog.findFirst({
      where: { batchId: id, target, status: IntegrationStatus.success },
    });
    if (existing) {
      results.push({ target, skipped: true, externalId: existing.externalId });
      return;
    }

    const res = await fn();
    const log = await prisma.integrationLog.create({
      data: {
        batchId: id,
        target,
        status: res.ok ? IntegrationStatus.success : IntegrationStatus.failed,
        externalId: res.externalId ?? null,
        error: res.error ?? null,
      },
    });

    if (!log) throw new Error("failed to persist integration log");
    results.push({ target, ok: res.ok, externalId: res.externalId, error: res.error });
  }

  await runTarget(IntegrationTarget.notion, () =>
    integration.appendToNotion({ batchId: id, batchName: batch.name, pulse, fee })
  );
  await runTarget(IntegrationTarget.gmail, () =>
    integration.createGmailDraft({ batchId: id, batchName: batch.name, pulse, fee })
  );

  const allOk = results.every((r) => r.skipped || r.ok);
  if (allOk) {
    await prisma.reviewBatch.update({
      where: { id },
      data: { status: BatchStatus.executed },
    });
  }

  return Response.json({
    approved: true,
    mode,
    results,
    status: allOk ? "executed" : "partial-failure",
  });
}