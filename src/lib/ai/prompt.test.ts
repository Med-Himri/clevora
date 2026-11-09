import { describe, expect, it } from "vitest";
import { buildSystemPrompt, buildUserMessage, chunkText } from "./prompt";

describe("assistant prompt", () => {
  it("tells the model staff cannot see money", () => {
    const staff = buildSystemPrompt({ agencyName: "Atlas", role: "staff", today: "2026-11-09", weekday: "lundi", locale: "fr" });
    expect(staff).toContain("Atlas");
    expect(staff).toContain("seuls les administrateurs");
    const admin = buildSystemPrompt({ agencyName: "Atlas", role: "admin", today: "2026-11-09", weekday: "lundi", locale: "ar" });
    expect(admin).not.toContain("seuls les administrateurs");
    expect(admin).toContain("arabe");
  });

  it("sends earlier turns as quoted text inside the user message", () => {
    expect(buildUserMessage([], "  Bonjour ")).toBe("Bonjour");
    const msg = buildUserMessage(
      [
        { role: "user", text: "Qui revient demain ?" },
        { role: "assistant", text: "La Clio de M. Alami." },
      ],
      "Et après-demain ?",
    );
    expect(msg).toContain("<conversation_precedente>");
    expect(msg).toContain("Assistant : La Clio de M. Alami.");
    expect(msg.endsWith("Nouvelle question : Et après-demain ?")).toBe(true);
  });

  it("keeps only the last turns and cuts long ones", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({ role: "user" as const, text: `q${i} ${"x".repeat(3000)}` }));
    const msg = buildUserMessage(history, "ok");
    expect(msg).not.toContain("q11 ");
    expect(msg).toContain("q12 ");
    expect(msg.length).toBeLessThan(8 * 1600 + 200);
  });
});

describe("chunkText", () => {
  it("returns nothing for empty text", () => {
    expect(chunkText("   \n\n ")).toEqual([]);
  });
  it("groups short paragraphs and splits long ones", () => {
    const text = ["Caution : 5 000 MAD.", "Franchise : 3 000 MAD.", "a".repeat(50) + ". " + "b".repeat(50) + "."].join("\n\n");
    expect(chunkText(text)).toHaveLength(1);
    const long = Array.from({ length: 30 }, (_, i) => `Phrase numéro ${i} du règlement de l'agence.`).join(" ");
    const chunks = chunkText(long, 200);
    expect(chunks.length).toBeGreaterThan(5);
    expect(chunks.every((c) => c.length <= 200)).toBe(true);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toContain("Phrase numéro 29");
  });
  it("splits Arabic sentences too", () => {
    const ar = Array.from({ length: 20 }, () => "الضمانة خمسة آلاف درهم؟").join(" ");
    expect(chunkText(ar, 100).length).toBeGreaterThan(3);
  });
});
