"use client";

import { CircleCheckIcon, CircleXIcon, LoaderIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testAssistantAction, type AssistantCheck as Check } from "../actions";

/** « Tester l'assistant »: says in plain words why the AI assistant works or not. */
export function AssistantCheck() {
  const t = useTranslations("platform.aiCheck");
  const [pending, start] = useTransition();
  const [check, setCheck] = useState<Check | null>(null);
  const run = () =>
    start(async () => {
      const r = await testAssistantAction();
      setCheck(r.ok ? r.data : { result: "network" });
    });
  return (
    <Card data-testid="platform-ai-check">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-muted-foreground" aria-hidden />
          {t("title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button size="lg" variant="outline" className="self-start" onClick={run} disabled={pending}>
          {pending ? <LoaderIcon className="animate-spin" aria-hidden /> : <SparklesIcon aria-hidden />}
          {t("run")}
        </Button>
        {check ? (
          <p className={`flex items-start gap-2 rounded-lg p-3 text-sm ${check.result === "ok" ? "bg-success-soft/60" : "bg-danger-soft/60"}`} role="status" data-testid="ai-check-result">
            {check.result === "ok" ? <CircleCheckIcon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <CircleXIcon className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />}
            <span>
              {check.result === "ok" ? t("ok", { provider: check.provider === "groq" ? "Groq" : "Claude", models: check.models.join(", ") }) : t(check.result)}
              {check.result !== "ok" && check.detail ? <span className="block text-xs text-muted-foreground">{check.detail}</span> : null}
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
