import "server-only";
import { dayKey } from "@/lib/format";
import { runTool, type AssistantEvent, type AssistantProvider, type AssistantRequest } from "./provider";

/**
 * Offline stand-in for tests and local dev without an API key (AI_PROVIDER=mock).
 * Picks a tool from keywords, runs it for real (RLS included) and prints the result.
 */
export class MockProvider implements AssistantProvider {
  async *answer(request: AssistantRequest): AsyncGenerator<AssistantEvent> {
    const q = (request.user.split("Nouvelle question :").pop() ?? request.user).toLowerCase();
    const today = dayKey(request.ctx.now);
    const plate = q.match(/\d{1,6}\s*[-/|]?\s*[a-zأ-ي]\s*[-/|]?\s*\d{1,3}/i)?.[0];
    const pick: [string, Record<string, unknown>] | null =
      plate ? ["who_had_car", { plate, date: today }]
      : /chiffre|revenue|revenu|ca |argent|gagn/.test(q) ? ["revenue", { from: `${today.slice(0, 7)}-01`, to: today }]
      : /charge|dépense/.test(q) ? ["charges", { from: `${today.slice(0, 7)}-01`, to: today }]
      : /vidange|oil/.test(q) ? ["oil_due", {}]
      : /assurance|visite/.test(q) ? ["insurance_due", {}]
      : /retour|récupérer/.test(q) ? ["upcoming_returns", { days: 2 }]
      : /libre|disponible/.test(q) ? ["car_availability", { start_date: today, end_date: today, end_time: "18:00" }]
      : /caution|règle|condition|document|franchise/.test(q) ? ["search_documents", { query: q }]
      : null;
    if (!pick) {
      yield { type: "text", delta: "Bonjour ! Posez-moi une question sur vos voitures, réservations ou documents." };
      yield { type: "done", tools: [], inputTokens: 0, outputTokens: 0 };
      return;
    }
    const [name, input] = pick;
    const allowed = request.tools.some((t) => t.name === name);
    if (!allowed) {
      yield { type: "text", delta: "Seuls les administrateurs de l'agence peuvent voir le chiffre d'affaires et les charges." };
      yield { type: "done", tools: [], inputTokens: 0, outputTokens: 0 };
      return;
    }
    yield { type: "tool", name };
    const result = await runTool(request.tools, request.ctx, name, input);
    yield { type: "text", delta: `[${name}] ${result.content}` };
    if (result.ok && result.sources.length) yield { type: "sources", sources: result.sources };
    yield { type: "done", tools: [name], inputTokens: 0, outputTokens: 0 };
  }
}
