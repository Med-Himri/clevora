import { expect, test } from "@playwright/test";
import { addMember, addVehicle, admin, createTestAgency, expectNoHorizontalScroll, login, uid } from "./helpers";

// The e2e server runs with AI_PROVIDER=mock: tools run for real (RLS included),
// only the language model is replaced by a keyword picker.

test("staff: asks about vidange, gets an answer with sources; money questions are refused", async ({ page }) => {
  const agency = await createTestAgency();
  const plate = `AI${uid().slice(-4).toUpperCase()}-A-6`;
  const carId = await addVehicle(agency.agencyId, { plate, brand_model: "Renault Clio" });
  await admin().from("vehicles").update({ current_km: 60000, oil_next_km: 60500 }).eq("id", carId);
  const staff = await addMember(agency.agencyId, "staff");
  await login(page, staff.email, staff.password);
  await page.goto("/assistant");
  await expect(page.getByRole("heading", { name: "Assistant IA" })).toBeVisible();
  await expect(page.getByTestId("assistant-docs")).toHaveCount(0); // staff cannot manage documents
  await expectNoHorizontalScroll(page);

  await page.getByTestId("assistant-suggestion").filter({ hasText: "vidange" }).click();
  const answer = page.getByTestId("assistant-answer").last();
  await expect(answer).toContainText("oil_due");
  await expect(answer).toContainText(plate);
  await expect(answer.getByTestId("assistant-sources").getByRole("link", { name: "Vidange" })).toBeVisible();

  await page.getByLabel("Votre question").fill("Quel est mon chiffre d'affaires ce mois-ci ?");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByTestId("assistant-answer").last()).toContainText("Seuls les administrateurs");
  await expectNoHorizontalScroll(page);

  // Straight to the API: still no revenue tool for staff
  const res = await page.request.post("/api/assistant", { data: { question: "chiffre d'affaires", history: [] } });
  expect(res.status()).toBe(200);
  expect(await res.text()).not.toContain('"name":"revenue"');

  // Privacy: one log row per question, tools only, never the text
  const { data: logs } = await admin().from("activity_log").select("details").eq("agency_id", agency.agencyId).eq("action", "assistant.question");
  expect(logs?.length).toBeGreaterThanOrEqual(2);
  expect(JSON.stringify(logs)).not.toContain("chiffre");
  expect(JSON.stringify(logs)).toContain("oil_due");
});

test("admin: adds a document, the assistant quotes it and links to it", async ({ page }) => {
  const agency = await createTestAgency();
  const amount = `${Math.floor(1000 + Math.random() * 8999)} MAD`;
  await login(page, agency.email, agency.password);
  await page.goto("/assistant");
  const docs = page.getByTestId("assistant-docs");
  await expect(docs).toContainText("Aucun document");
  await docs.getByRole("button", { name: "Ajouter" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Titre").fill("Règlement intérieur");
  await dialog.getByLabel("Texte du document").fill(`La caution est de ${amount} pour toutes les voitures.\n\nLe carburant est à rendre au même niveau.`);
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
  await expect(docs).toContainText("Règlement intérieur");

  await page.getByLabel("Votre question").fill("Quelle est la caution ?");
  await page.keyboard.press("Enter");
  const answer = page.getByTestId("assistant-answer").last();
  await expect(answer).toContainText(amount);
  await answer.getByRole("link", { name: "Règlement intérieur" }).click();
  await expect(page.getByTestId("assistant-doc")).toContainText(`La caution est de ${amount}`);
  await expectNoHorizontalScroll(page);

  // Revenue works for admins
  await page.getByLabel("Votre question").fill("Mon chiffre d'affaires ?");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByTestId("assistant-answer").last()).toContainText("chiffre_affaires");

  // Another agency never sees this document
  const other = await createTestAgency();
  const { data } = await admin().from("ai_chunks").select("agency_id").ilike("content", `%caution est de ${amount}%`);
  expect(data?.every((c) => c.agency_id === agency.agencyId)).toBe(true);
  expect(other.agencyId).not.toBe(agency.agencyId);

  await docs.getByRole("button", { name: "Supprimer « Règlement intérieur »" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(docs).toContainText("Aucun document");
});

test("assistant switched off, or not in the plan", async ({ page }) => {
  const agency = await createTestAgency();
  await admin().from("agencies").update({ ai_enabled: false }).eq("id", agency.agencyId);
  await login(page, agency.email, agency.password);
  await page.goto("/assistant");
  await expect(page.getByText("L'assistant IA est désactivé")).toBeVisible();
  const off = await page.request.post("/api/assistant", { data: { question: "bonjour" } });
  expect(off.status()).toBe(403);

  const { data: plan } = await admin().from("plans").select("id").eq("code", "essentiel").single();
  await admin().from("agencies").update({ ai_enabled: true, plan_id: plan!.id }).eq("id", agency.agencyId);
  await page.reload();
  await expect(page.getByText("L'assistant IA n'est pas inclus dans votre forfait")).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir les forfaits" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});
