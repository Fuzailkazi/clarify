"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudUpload, FileText, Upload } from "lucide-react";
import { parseCsv } from "@/lib/csv";
import { Nav } from "@/app/components/nav";
import { StatusPill } from "@/app/components/status-pill";

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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ rows: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/batches", { cache: "no-store" });
      if (res.ok) setBatches((await res.json()).batches);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFile(file: File) {
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first");
      return;
    }
    await uploadFile(file);
  }

  async function useSampleCsv() {
    const res = await fetch("/sample-reviews.csv");
    const content = await res.text();
    const file = new File([content], "sample-reviews.csv", { type: "text/csv" });
    await uploadFile(file);
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
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <section className="mx-auto w-full max-w-[600px] rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-teal-600/60 bg-teal-50/60 px-6 py-8 transition-colors hover:border-teal-600 hover:bg-teal-50 dark:border-teal-500/50 dark:bg-teal-500/10 dark:hover:border-teal-400 dark:hover:bg-teal-500/15">
              <CloudUpload className="h-10 w-10 text-teal-600 dark:text-teal-400" strokeWidth={1.75} />
              <div className="text-center">
                <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                  Drop your CSV here or click to upload
                </p>
                <p className="mt-1 text-[13px] text-zinc-400">
                  Headers <code className="font-mono">text</code> and{" "}
                  <code className="font-mono">rating</code>
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  setError(null);
                  setPreview(null);
                  if (e.target.files?.[0]) onFilePicked(e.target.files[0]);
                }}
              />
            </label>

            {preview && (
              <span className="inline-flex w-fit items-center gap-1.5 self-center rounded-full bg-teal-50 px-3 py-1.5 text-xs text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                {preview.rows} reviews ready to upload
              </span>
            )}
            {error && (
              <p className="self-center text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload reviews"}
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={useSampleCsv}
                className="rounded-lg border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {uploading ? "…" : "Try sample CSV"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-12">
          <h2 className="text-base font-semibold tracking-tight">Batches</h2>
          {loading ? (
            <p className="mt-3 text-sm text-zinc-500">Loading…</p>
          ) : batches.length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900">
              <FileText className="h-8 w-8 text-zinc-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-500">No batches yet</p>
              <p className="text-[13px] text-zinc-400">
                Upload a reviews CSV to get started.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="hidden grid-cols-[200px_160px_160px_1fr] gap-2 border-b border-zinc-100 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900 sm:grid">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Batch ID
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Reviews
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Created
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-right">
                  Status
                </span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {batches.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/batches/${b.id}`}
                      className="grid grid-cols-2 items-center gap-2 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 sm:grid-cols-[200px_160px_160px_1fr]"
                    >
                      <span className="font-mono text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                        {b.name}
                      </span>
                      <span className="hidden font-mono text-[13px] text-zinc-700 dark:text-zinc-400 sm:block">
                        {b._count.reviews}
                      </span>
                      <span className="hidden text-[13px] text-zinc-700 dark:text-zinc-400 sm:block">
                        {formatDate(b.createdAt)}
                      </span>
                      <span className="justify-self-end">
                        <StatusPill status={b.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
