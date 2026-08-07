"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApprovePanel({
  batchId,
  approved,
  approvedBy,
  status,
}: {
  batchId: string;
  approved: boolean;
  approvedBy?: string | null;
  status: string;
}) {
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<"approve" | "execute" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function onApprove() {
    if (!name.trim()) {
      setError("Enter your name to record the approval");
      return;
    }
    setBusy("approve");
    setError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: name.trim() }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? "Approval failed");
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Approval failed");
      setBusy(null);
    }
  }

  async function onExecute() {
    setBusy("execute");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/batches/${batchId}/execute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Execution failed");
      } else {
        const summary = (data.results ?? [])
          .map(
            (r: { target: string; ok?: boolean; skipped?: boolean }) =>
              `${r.target}: ${r.skipped ? "already done" : r.ok ? "ok" : "failed"}`
          )
          .join(", ");
        setResult(
          `${data.mode === "mock" ? "Mock mode — " : ""}execution complete. ${summary}`
        );
        router.refresh();
      }
    } catch {
      setError("Execution failed");
    } finally {
      setBusy(null);
    }
  }

  if (approved) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Approved
          </span>
          <p className="text-sm font-medium">
            by {approvedBy ?? "unknown"} — external actions unlocked
          </p>
        </div>
        <div className="mt-3">
          <button
            onClick={onExecute}
            disabled={busy === "execute" || status === "executed"}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === "execute"
              ? "Executing…"
              : status === "executed"
                ? "Executed"
                : "Execute (Notion + Gmail)"}
          </button>
          {result && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{result}</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
      <h2 className="text-sm font-semibold">Review & approve external actions</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        On approval, Clarify will: append this pulse + fee explanation to <b>Notion</b> and create
        a <b>Gmail draft</b> with the weekly pulse and support explanation.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (recorded with approval)"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          I have reviewed the output
        </label>
        <button
          onClick={onApprove}
          disabled={!confirm || busy === "approve"}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy === "approve" ? "Approving…" : "Approve & unlock"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}