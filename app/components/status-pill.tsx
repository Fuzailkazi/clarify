const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  analyzed: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  generated: "bg-teal-600 text-white",
  awaiting_approval: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  executed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const DOT_STYLES: Record<string, string> = {
  uploaded: "bg-zinc-400 dark:bg-zinc-500",
  analyzed: "bg-teal-600 dark:bg-teal-400",
  generated: "bg-white",
  awaiting_approval: "bg-amber-600 dark:bg-amber-400",
  executed: "bg-emerald-600 dark:bg-emerald-400",
};

export function StatusPill({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${
        STATUS_STYLES[status] ?? STATUS_STYLES.uploaded
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[status] ?? DOT_STYLES.uploaded}`} />
      {label}
    </span>
  );
}
