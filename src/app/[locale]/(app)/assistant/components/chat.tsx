"use client";

import { ArrowUpIcon, ExternalLinkIcon, SparklesIcon, SquareIcon, SquarePenIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { AnswerText } from "./answer-text";

type Source = { label: string; href: string };
type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  tool?: string | null;
  sources?: Source[];
  error?: string;
  pending?: boolean;
};

const MAX = 1000;

/**
 * The conversation lives only in this browser tab (never saved on the server).
 * Each answer streams in as NDJSON events from /api/assistant.
 */
export function Chat({ remaining }: { remaining: number | null }) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(remaining);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  const update = (id: number, patch: (m: Message) => Partial<Message>) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)));

  const ask = async (text: string) => {
    const q = text.trim().slice(0, MAX);
    if (!q || busy) return;
    const history = messages.filter((m) => !m.error && m.text).map((m) => ({ role: m.role, text: m.text }));
    const userId = nextId.current++;
    const botId = nextId.current++;
    setMessages((list) => [...list, { id: userId, role: "user", text: q }, { id: botId, role: "assistant", text: "", pending: true, tool: null }]);
    setQuestion("");
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history, locale }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        update(botId, () => ({ error: body.error ?? "unavailable", pending: false }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line) as { type: string; delta?: string; name?: string; sources?: Source[]; error?: string };
          if (e.type === "text" && e.delta) update(botId, (m) => ({ text: m.text + e.delta, tool: null }));
          else if (e.type === "tool") update(botId, () => ({ tool: e.name ?? null }));
          else if (e.type === "sources") update(botId, () => ({ sources: e.sources }));
          else if (e.type === "error") update(botId, () => ({ error: e.error ?? "unavailable" }));
        }
      }
      setLeft((n) => (n === null ? n : Math.max(0, n - 1)));
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) update(botId, () => ({ error: "unavailable" }));
    } finally {
      update(botId, (m) => ({ pending: false, text: m.text.trim() }));
      setBusy(false);
      abort.current = null;
      inputRef.current?.focus();
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(question);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void ask(question);
    }
  };

  // The textarea grows with the text (up to ~6 lines), like a chat app
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [question]);

  return (
    <div className="flex min-h-[calc(100dvh-13rem)] flex-col md:min-h-[calc(100dvh-10rem)]">
      {messages.length ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setMessages([])}
            disabled={busy}
            className={cn("inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-medium hover:bg-accent", busy && "opacity-50")}
          >
            <SquarePenIcon className="size-4" aria-hidden />
            {t("newChat")}
          </button>
        </div>
      ) : null}

      {messages.length === 0 ? (
        /* Empty conversation: a welcome in the middle, like a chat app */
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center" data-testid="assistant-welcome">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md" aria-hidden>
            <SparklesIcon className="size-7" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("welcome")}</h2>
          <p className="max-w-md text-muted-foreground">{t("welcomeHint")}</p>
        </div>
      ) : (
        <ol className="flex flex-1 flex-col gap-6 pb-4" aria-live="polite" aria-label={t("conversation")} data-testid="assistant-messages">
          {messages.map((m) =>
            m.role === "user" ? (
              <li key={m.id} className="flex justify-end">
                <p dir="auto" className="max-w-[85%] rounded-3xl bg-muted px-4 py-2.5 whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {m.text}
                </p>
              </li>
            ) : (
              <li key={m.id} className="flex gap-3" data-testid="assistant-answer">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                  <SparklesIcon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                  {m.text ? <AnswerText text={m.text} /> : null}
                  {m.pending && !m.text ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                      <span className="flex gap-1" aria-hidden>
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                      </span>
                      {m.tool ? t(`tools.${m.tool}`) : t("thinking")}
                    </p>
                  ) : null}
                  {m.error ? (
                    <p role="alert" className="rounded-lg bg-danger-soft/60 px-3 py-2 text-sm font-medium text-destructive">
                      {t(`errors.${m.error}`)}
                    </p>
                  ) : null}
                  {m.sources?.length ? (
                    <ul className="flex flex-wrap gap-2" data-testid="assistant-sources" aria-label={t("sources")}>
                      {m.sources.map((src) => (
                        <li key={src.href}>
                          <Link href={src.href} className="inline-flex min-h-9 items-center gap-1 rounded-full border bg-card px-3 text-xs font-medium hover:bg-accent">
                            <ExternalLinkIcon className="size-3.5 rtl:-scale-x-100" aria-hidden />
                            <span dir="auto">{src.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ),
          )}
        </ol>
      )}
      <div ref={endRef} />

      {/* Composer: a rounded field with the send button inside, kept at the bottom */}
      <form
        onSubmit={submit}
        className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 bg-background/95 px-3 pt-2 pb-2 backdrop-blur md:sticky md:bottom-0 md:bg-background md:px-0 md:pb-4 md:backdrop-blur-none"
      >
        <label htmlFor="assistant-question" className="sr-only">
          {t("questionLabel")}
        </label>
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <textarea
            ref={inputRef}
            id="assistant-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX))}
            onKeyDown={onKey}
            placeholder={t("placeholder")}
            rows={1}
            dir="auto"
            className="max-h-42 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground md:text-sm"
            disabled={left === 0}
          />
          {busy ? (
            <Button type="button" size="icon" variant="outline" className="size-10 shrink-0 rounded-full" onClick={() => abort.current?.abort()} aria-label={t("stop")} title={t("stop")}>
              <SquareIcon className="fill-current" aria-hidden />
            </Button>
          ) : (
            <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full" disabled={!question.trim() || left === 0} aria-label={t("send")} title={t("send")}>
              <ArrowUpIcon aria-hidden />
            </Button>
          )}
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-xs text-muted-foreground">
          {left === null ? t("disclaimer") : `${t("remaining", { count: left })} · ${t("disclaimer")}`}
        </p>
      </form>
    </div>
  );
}
