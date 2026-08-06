"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseCsv } from "@/lib/csv";

type BatchSummary = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  _count: { reviews: number };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Home() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ rows: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    const res = await fetch("/api/batches", { cache: "no-store" });
    if (res.ok) setBatches((await res.json()).batches);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/batches", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }
      router.push(`/batches/${data.batch.id}`);
    } catch {
      setError("Upload failed");
      setUploading(false);
    }
  }

  function onFilePicked(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ""));
      if (rows.length === 0) setError("No valid reviews found in CSV");
      else setPreview({ rows: rows.length });
    };
    reader.readAsText(file);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Clarify</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Product insights and support intelligence from customer reviews.
      </p>

      <section className="mt-8 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-sm font-medium">Upload reviews</h2>
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && onFilePicked(e.target.files[0])}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-50 dark:file:bg-zinc-100 dark:file:text-zinc-900"
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
        {preview && (
          <p className="mt-2 text-xs text-emerald-600">
            Ready: {preview.rows} reviews will be stored.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium">Batches</h2>
        {batches.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No batches yet — upload a reviews CSV to get started.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {batches.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/batches/${b.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-zinc-500">
                      {b._count.reviews} reviews · {formatDate(b.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {b.status.replace(/_/g, " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}