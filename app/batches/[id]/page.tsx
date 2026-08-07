import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnalyzeButton } from "./analyze-button";
import { GenerateButton } from "./generate-button";
import { ApprovePanel } from "./approve-panel";

function formatDate(iso: Date) {
  return iso.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = await prisma.reviewBatch.findUnique({
    where: { id },
    include: {
      reviews: { orderBy: { createdAt: "asc" } },
      themes: { orderBy: { rank: "asc" } },
      pulse: true,
      fee: true,
      approval: true,
    },
  });

  if (!batch) notFound();
  const themed = batch.themes.length > 0;
  const generated = Boolean(batch.pulse);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← All batches
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{batch.name}</h1>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {batch.status.replace(/_/g, " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {batch.reviews.length} reviews · {batch.sourceFile} · uploaded {formatDate(batch.createdAt)}
      </p>

      {!themed && (
        <section className="mt-6 rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
          <h2 className="text-sm font-medium">Review intelligence</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Cluster the reviews into themes using Gemini (deterministic keyword clues first, then
            AI refinement).
          </p>
          <div className="mt-3">
            <AnalyzeButton batchId={batch.id} />
          </div>
        </section>
      )}

      {themed && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Themes</h2>
            <AnalyzeButton
              batchId={batch.id}
              disabled={batch.status === "executed"}
              canRerun={batch.status !== "uploaded"}
            />
          </div>
          <ul className="mt-3 space-y-3">
            {batch.themes.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                      t.rank <= 3
                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    #{t.rank}
                  </span>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.count} reviews</p>
                </div>
                <ul className="mt-2 space-y-1">
                  {t.sampleQuotes.map((q, i) => (
                    <li key={i} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      “{q}”
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {themed && (
        <section className="mt-6 rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
          <h2 className="text-sm font-medium">Product & support intelligence</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Generate a weekly product pulse and a reusable support explanation for the recurring fee
            confusion.
          </p>
          <div className="mt-3">
            <GenerateButton
              batchId={batch.id}
              disabled={batch.status === "executed"}
              canRerun={generated}
            />
          </div>
        </section>
      )}

      {generated && batch.pulse && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Weekly pulse</h2>
            <span className="text-xs text-zinc-400">{batch.pulse.wordCount}/250 words</span>
          </div>
          <div className="mt-3 space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Summary</h3>
              <p className="mt-1 text-sm leading-relaxed">{batch.pulse.summary}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Observation
              </h3>
              <p className="mt-1 text-sm leading-relaxed">{batch.pulse.observation}</p>
            </div>
            {typeof batch.pulse.actions === "object" && Array.isArray(batch.pulse.actions) && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Actions
                </h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {(batch.pulse.actions as string[]).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {batch.fee && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Support explanation</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {batch.fee.feeName}
            </span>
          </div>
          <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm leading-relaxed">{batch.fee.explanation}</p>
            <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Official sources
            </h3>
            <ul className="mt-1 space-y-1">
              {Array.isArray(batch.fee.officialSources) &&
                (batch.fee.officialSources as { title: string; url: string }[]).map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      )}

      {generated && (
        <ApprovePanel
          batchId={batch.id}
          approved={Boolean(batch.approval)}
          approvedBy={batch.approval?.approvedBy}
          status={batch.status}
        />
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium">Reviews</h2>
        <ul className="mt-3 space-y-2">
          {batch.reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <p className="text-sm leading-relaxed">{r.text}</p>
              {r.rating !== null && (
                <p className="mt-1 text-xs text-zinc-400">Rating: {r.rating}/5</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}