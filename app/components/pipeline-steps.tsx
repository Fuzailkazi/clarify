const STEPS = [
  { key: "uploaded", label: "Uploaded" },
  { key: "analyzed", label: "Analyzed" },
  { key: "generated", label: "Generated" },
  { key: "awaiting_approval", label: "Approved" },
  { key: "executed", label: "Executed" },
] as const;

const ORDER = STEPS.map((s) => s.key);
const toIndex = (k: string): number => {
  const i = ORDER.indexOf(k as (typeof ORDER)[number]);
  return i === -1 ? 0 : i;
};

export function PipelineSteps({ status }: { status: string }) {
  const current = toIndex(status);

  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                active
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
            >
              <span className="tabular-nums">{i + 1}</span>
              {step.label}
            </span>
            {i < STEPS.length - 1 && <span className="text-zinc-300 dark:text-zinc-700">→</span>}
          </li>
        );
      })}
    </ol>
  );
}