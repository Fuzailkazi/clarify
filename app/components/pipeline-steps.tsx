import { Check, Circle, ShieldCheck } from "lucide-react";

const STEPS = [
  { key: "uploaded", label: "Uploaded", gate: false },
  { key: "analyzed", label: "Analyzed", gate: false },
  { key: "generated", label: "Generated", gate: false },
  { key: "awaiting_approval", label: "Approved", gate: true },
  { key: "executed", label: "Executed", gate: false },
] as const;

const ORDER = STEPS.map((s) => s.key);
const toIndex = (k: string): number => {
  const i = ORDER.indexOf(k as (typeof ORDER)[number]);
  return i === -1 ? 0 : i;
};

const GATE_STYLES = {
  active: "border-amber-600/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  done: "border-amber-600/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  pending: "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500",
};

export function PipelineSteps({ status }: { status: string }) {
  const current = toIndex(status);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${
                step.gate
                  ? active || done
                    ? GATE_STYLES.active
                    : GATE_STYLES.pending
                  : active
                    ? "border-teal-600 bg-teal-600 text-white"
                    : done
                      ? "border-teal-600/30 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                      : "border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
            >
              {step.gate ? (
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              ) : done ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <Circle className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`h-0.5 min-w-3 flex-1 rounded-full ${
                  i < current ? "bg-teal-500" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
