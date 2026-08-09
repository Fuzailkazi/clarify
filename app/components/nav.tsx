import Link from "next/link";
import { Activity } from "lucide-react";

export function Nav() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:px-12">
      <Link href="/" className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" strokeWidth={2} />
        <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Clarify
        </span>
      </Link>
      <p className="hidden text-[13px] text-zinc-700 dark:text-zinc-400 md:block">
        Product insights and support intelligence from customer reviews.
      </p>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600">
        <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
    </header>
  );
}
