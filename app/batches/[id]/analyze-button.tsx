"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnalyzeButton({
  batchId,
  disabled,
  canRerun,
}: {
  batchId: string;
  disabled?: boolean;
  canRerun?: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onClick() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}/analyze`, { method: "POST" });
      if (!res.ok) {
        setError((await res.json()).error ?? "Analysis failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Analysis failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled || running}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {running ? "Analyzing…" : canRerun ? "Re-run analysis" : "Cluster themes"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}