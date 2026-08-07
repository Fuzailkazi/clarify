"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateButton({
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
      const res = await fetch(`/api/batches/${batchId}/generate`, { method: "POST" });
      if (!res.ok) {
        setError((await res.json()).error ?? "Generation failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Generation failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled || running}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {running ? "Generating…" : canRerun ? "Re-generate" : "Generate pulse & explanation"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}