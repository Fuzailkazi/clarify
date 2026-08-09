"use client";

import { FormEvent, useRef, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

export function AskPanel({ batchId, reviewCount }: { batchId: string; reviewCount: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onAsk(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy) return;
    setQuestion("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/batches/${batchId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Question failed");
      } else {
        setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
      }
    } catch {
      setError("Question failed");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <MessageSquareText className="h-5 w-5 text-teal-600 dark:text-teal-400" strokeWidth={2} />
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Ask your reviews
        </h2>
        <span className="ml-auto font-mono text-xs text-zinc-400">
          {reviewCount} reviews
        </span>
      </div>

      {messages.length > 0 && (
        <div className="mt-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-teal-600 px-4 py-2.5 text-[13px] leading-relaxed text-white"
                  : "w-fit max-w-[95%] rounded-xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 text-[13px] leading-relaxed text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div className="w-fit rounded-xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 text-[13px] text-zinc-400 dark:bg-zinc-800">
              Thinking…
            </div>
          )}
        </div>
      )}

      {messages.length === 0 && !busy && (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center dark:border-zinc-700">
          <p className="text-[13px] text-zinc-500">
            Ask anything about this batch — e.g.{" "}
            <span className="text-zinc-700 dark:text-zinc-300">
              “what are people saying about pricing?”
            </span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Answers are grounded only in the {reviewCount} uploaded reviews.
          </p>
        </div>
      )}

      <form onSubmit={onAsk} className="mt-4 flex items-center gap-2">
        <input
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this batch of reviews…"
          disabled={busy}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={!question.trim() || busy}
          className="rounded-lg bg-teal-600 p-2.5 text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
          aria-label="Ask"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
}
