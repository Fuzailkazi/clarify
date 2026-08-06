import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

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