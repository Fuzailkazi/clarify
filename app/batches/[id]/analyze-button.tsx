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
        className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
      >
        {running ? "Analyzing…" : canRerun ? "Re-run analysis" : "Cluster themes"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}