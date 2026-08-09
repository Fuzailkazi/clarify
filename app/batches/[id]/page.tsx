import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Hash,
  Mail,
  Minus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Nav } from "@/app/components/nav";
import { AnalyzeButton } from "./analyze-button";
import { GenerateButton } from "./generate-button";
import { ApprovePanel } from "./approve-panel";
import { AskPanel } from "./ask-panel";
import { PipelineSteps } from "../../components/pipeline-steps";

function formatDate(iso: Date) {
  return iso.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function WordRing({ count, max }: { count: number; max: number }) {
  const r = 12.5;
  const c = 2 * Math.PI * r;
  const dash = Math.min(count / max, 1) * c;
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 -rotate-90">
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-zinc-200 dark:text-zinc-700"
      />
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        className="text-teal-600 dark:text-teal-400"
      />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-[12px] leading-none ${
            i < rating ? "text-teal-600 dark:text-teal-400" : "text-zinc-300 dark:text-zinc-600"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const TARGET_ICONS: Record<string, typeof FileText> = {
  notion: FileText,
  gmail: Mail,
  slack: Hash,
  google_docs: FileText,
};

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
      logs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!batch) notFound();
  const themed = batch.themes.length > 0;
  const generated = Boolean(batch.pulse);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="font-medium text-teal-600 hover:underline dark:text-teal-400">
            Batches
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="font-mono text-[13px] text-zinc-700 dark:text-zinc-400">
            {batch.name}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {batch.name}
          </h1>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[13px] font-medium text-zinc-700 dark:text-zinc-400">
              {batch.reviews.length} reviews
            </span>
            <span className="text-[13px] text-zinc-400">Created {formatDate(batch.createdAt)}</span>
          </div>
        </div>

        <div className="mt-4">
          <PipelineSteps status={batch.status} />
        </div>

        {!themed && (
          <section className="mt-8 rounded-xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
            <h2 className="text-base font-semibold tracking-tight">Review intelligence</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-zinc-500">
              Cluster the reviews into themes using Gemini (deterministic keyword clues first, then
              AI refinement).
            </p>
            <div className="mt-4">
              <AnalyzeButton batchId={batch.id} />
            </div>
          </section>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {themed && (
              <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Top Themes
                  </h2>
                  <span className="font-mono text-xs text-zinc-400">
                    {batch.themes.length} themes detected
                  </span>
                </div>
                <ul className="mt-5 space-y-6">
                  {batch.themes.map((t) => {
                    const max = Math.max(...batch.themes.map((x) => x.count), 1);
                    const top = t.rank <= 3;
                    return (
                      <li key={t.id}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`rounded-[10px] px-2 py-0.5 font-mono text-[11px] font-medium ${
                                top
                                  ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              #{t.rank}
                            </span>
                            <p className="truncate text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                              {t.name}
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-xs text-zinc-700 dark:text-zinc-400">
                            {t.count}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className={`h-1.5 rounded-full ${top ? "bg-teal-600" : "bg-zinc-400 dark:bg-zinc-600"}`}
                            style={{ width: `${(t.count / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 flex justify-end">
                  <AnalyzeButton
                    batchId={batch.id}
                    disabled={batch.status === "executed"}
                    canRerun={batch.status !== "uploaded"}
                  />
                </div>
              </section>
            )}

            {themed && !generated && (
              <section className="rounded-xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
                <h2 className="text-base font-semibold tracking-tight">Product & support intelligence</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                  Generate a weekly product pulse and a reusable support explanation for the
                  recurring fee confusion.
                </p>
                <div className="mt-4">
                  <GenerateButton batchId={batch.id} canRerun={false} />
                </div>
              </section>
            )}

            {generated && batch.pulse && (
              <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" strokeWidth={2} />
                    <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      Weekly Pulse
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <WordRing count={batch.pulse.wordCount} max={250} />
                    <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-400">
                      {batch.pulse.wordCount} / 250 words
                    </span>
                  </div>
                </div>
                <div className="mt-5 space-y-5">
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-zinc-400">
                      Summary
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
                      {batch.pulse.summary}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-zinc-400">
                      Key observations
                    </h3>
                    <ul className="mt-1.5 space-y-1.5">
                      {[batch.pulse.observation].flat().map((o, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
                          <span className="text-teal-600 dark:text-teal-400">•</span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {typeof batch.pulse.actions === "object" && Array.isArray(batch.pulse.actions) && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-zinc-400">
                        Recommended actions
                      </h3>
                      <ul className="mt-1.5 space-y-1.5">
                        {(batch.pulse.actions as string[]).map((a, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(batch.pulse.trends) && batch.pulse.trends.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-zinc-400">
                        Trends vs last week
                      </h3>
                      <ul className="mt-1.5 space-y-1.5">
                        {(batch.pulse.trends as { name: string; count: number; prevCount: number | null; delta: number }[]).map((t, i) => {
                          const isNew = t.prevCount === null;
                          const up = t.delta > 0;
                          const down = t.delta < 0;
                          return (
                            <li
                              key={i}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="flex min-w-0 items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                {isNew ? (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                ) : up ? (
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                                ) : down ? (
                                  <TrendingDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                ) : (
                                  <Minus className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                                )}
                                <span className="truncate">{t.name}</span>
                              </span>
                              <span
                                className={`shrink-0 font-mono text-xs ${
                                  isNew
                                    ? "text-amber-600 dark:text-amber-400"
                                    : up
                                      ? "text-teal-600 dark:text-teal-400"
                                      : "text-zinc-500 dark:text-zinc-400"
                                }`}
                              >
                                {isNew ? `new · ${t.count}` : `${t.delta >= 0 ? "+" : ""}${t.delta} · ${t.count}`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <GenerateButton
                      batchId={batch.id}
                      disabled={batch.status === "executed"}
                      canRerun
                    />
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            {batch.fee && (
              <section className="rounded-xl border border-amber-600/20 bg-white p-6 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Support explanation
                  </h2>
                  <span className="shrink-0 rounded-[10px] bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    {batch.fee.feeName}
                  </span>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-400">
                  {batch.fee.explanation}
                </p>
                <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[0.8px] text-zinc-400">
                  Official sources
                </h3>
                <ul className="mt-1.5 space-y-1.5">
                  {Array.isArray(batch.fee.officialSources) &&
                    (batch.fee.officialSources as { title: string; url: string }[]).map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-teal-600 hover:underline dark:text-teal-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="font-mono text-[11px]">{s.title}</span>
                        </a>
                      </li>
                    ))}
                </ul>
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
          </div>
        </div>

        <div className="mt-8">
          <AskPanel batchId={batch.id} reviewCount={batch.reviews.length} />
        </div>

        {batch.logs.length > 0 && (
          <section className="mt-10">
            <h2 className="text-base font-semibold tracking-tight">Integration log</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="grid grid-cols-[200px_160px_1fr_auto] items-center gap-2 bg-zinc-100 px-5 py-3 dark:bg-zinc-800/50">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Target
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Status
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  External ID
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Timestamp
                </span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {batch.logs.map((log) => {
                  const Icon = TARGET_ICONS[log.target] ?? FileText;
                  return (
                    <li
                      key={log.id}
                      className="grid grid-cols-[200px_160px_1fr_auto] items-center gap-2 px-5 py-3.5"
                    >
                      <span className="flex items-center gap-2 text-[13px] capitalize text-zinc-900 dark:text-zinc-100">
                        <Icon className="h-4 w-4 text-zinc-400" strokeWidth={2} />
                        {log.target.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-xs font-medium capitalize ${
                          log.status === "success"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            log.status === "success"
                              ? "bg-emerald-600 dark:bg-emerald-400"
                              : "bg-red-600 dark:bg-red-400"
                          }`}
                        />
                        {log.status}
                      </span>
                      <span className="truncate font-mono text-xs text-zinc-400">
                        {log.error ?? log.externalId ?? "—"}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">
                        {formatDate(log.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Reviews</h2>
            <span className="font-mono text-xs text-zinc-400">{batch.reviews.length} reviews</span>
          </div>
          <ul className="mt-3 space-y-3">
            {batch.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-[10px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating ?? 0} />
                  {r.rating !== null && (
                    <span className="font-mono text-xs text-zinc-400">{r.rating}/5</span>
                  )}
                </div>
                <div className="mt-3 flex gap-3">
                  <span className="w-[3px] shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  <p className="text-[13px] italic leading-relaxed text-zinc-700 dark:text-zinc-400">
                    {r.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
