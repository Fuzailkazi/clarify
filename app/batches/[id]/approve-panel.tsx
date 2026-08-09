"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Hash, Mail, ShieldCheck } from "lucide-react";

const TARGETS = [
  { key: "notion", label: "Notion", icon: FileText },
  { key: "gmail", label: "Gmail draft", icon: Mail },
  { key: "slack", label: "Slack", icon: Hash },
  { key: "google_docs", label: "Google Doc", icon: FileText },
];

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

  const executed = status === "executed";

  return (
    <section className="rounded-xl border border-amber-600/20 bg-white p-6 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Human approval required
        </h2>
      </div>

      {approved ? (
        <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 py-2 dark:bg-emerald-500/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Approved by {approvedBy ?? "unknown"}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-50 py-2 dark:bg-amber-500/10">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Awaiting approval
          </p>
        </div>
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-400">
        On approval, Clarify will log this pulse and fee explanation to your connected targets.
        Targets without credentials are skipped.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TARGETS.map((t) => {
          const Icon = t.icon;
          return (
            <span
              key={t.key}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
              {t.label}
            </span>
          );
        })}
      </div>

      {!approved && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Step 1 — Approve
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <label className="mt-3 flex items-center gap-2 text-[13px] text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="h-4 w-4 rounded accent-teal-600"
            />
            I have reviewed the generated output
          </label>
          <button
            onClick={onApprove}
            disabled={!confirm || busy === "approve"}
            className="mt-4 w-full rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
          >
            {busy === "approve" ? "Approving…" : "Approve"}
          </button>
        </div>
      )}

      {approved && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Step 2 — Execute
          </p>
          <button
            onClick={onExecute}
            disabled={busy === "execute" || executed}
            className="mt-2 w-full rounded-lg border border-teal-600 py-3 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-40 dark:text-teal-400 dark:hover:bg-teal-500/10"
          >
            {busy === "execute"
              ? "Executing…"
              : executed
                ? "Executed"
                : "Execute approved actions"}
          </button>
          {!executed && (
            <p className="mt-2 text-xs text-zinc-400">Executes after approval</p>
          )}
        </div>
      )}

      {result && <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">{result}</p>}
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
}
