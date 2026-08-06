import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnalyzeButton } from "./analyze-button";

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
    },
  });

  if (!batch) notFound();
  const themed = batch.themes.length > 0;

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
            Cluster the reviews into themes. This uses deterministic keyword analysis — no AI
            tokens spent.
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
            <AnalyzeButton batchId={batch.id} disabled={batch.status !== "uploaded"} />
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