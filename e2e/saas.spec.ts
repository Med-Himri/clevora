import { expect, test } from "@playwright/test";
import { addMember, addVehicle, admin, createPlatformAdmin, createTestAgency, expectNoHorizontalScroll, login, uid } from "./helpers";

test("marketing home: hero, features and the three plans from the database", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre agence de location, simplement.");
  await expect(page.getByTestId("marketing-plans").getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3 }) })).toHaveCount(3);
  await expect(page.getByTestId("marketing-plans")).toContainText("599 MAD");
  await expectNoHorizontalScroll(page);
  await page.getByRole("link", { name: "Essayer gratuitement 14 jours" }).first().click();
  await page.waitForURL(/\/signup/);
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expectNoHorizontalScroll(page);
});

test("billing: admin asks for a plan, Parcolia confirms it, the invoice PDF is ready", async ({ page, browser }) => {
  const agency = await createTestAgency({ trialEnded: true });
  await login(page, agency.email, agency.password);
  await page.goto("/billing");
  await expect(page.getByText("Votre agence est en lecture seule")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.getByRole("radio", { name: /Annuel/ }).click();
  await page.getByTestId("plan-pro").getByRole("button", { name: "Choisir Pro" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Valider ma demande" }).click();
  await expect(page.getByTestId("billing-pending")).toBeVisible();
  const reference = (await page.getByTestId("billing-reference").innerText()).trim();
  expect(reference).toMatch(/^PAR-[0-9A-F]{8}$/);
  await expect(page.getByTestId("billing-pending")).toContainText("5 990 MAD");

  // Parcolia staff confirm the transfer in /platform
  const staff = await createPlatformAdmin();
  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto("/login");
  await p2.getByLabel("Adresse e-mail").fill(staff.email);
  await p2.getByLabel("Mot de passe", { exact: true }).fill(staff.password);
  await p2.getByRole("button", { name: "Se connecter", exact: true }).click();
  await p2.waitForURL(/\/platform/);
  const row = p2.getByTestId("platform-pending").getByRole("listitem").filter({ hasText: reference });
  await row.getByRole("button", { name: "Paiement reçu" }).click();
  await p2.getByRole("dialog").getByRole("button", { name: "Paiement reçu" }).click();
  await expect(p2.getByText(/Paiement validé\. Facture F-\d{4}-\d{5}/)).toBeVisible();
  await expectNoHorizontalScroll(p2);
  await ctx.close();

  await page.reload();
  await expect(page.getByTestId("billing-status")).toContainText("Abonnement payé jusqu'au");
  await expect(page.getByText("Votre agence est en lecture seule")).toHaveCount(0);
  const { data: pay } = await admin().from("subscription_payments").select("id").eq("reference", reference).single();
  const pdf = await page.request.get(`/api/invoices/${pay!.id}`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
});

test("billing and /platform are closed to the wrong people", async ({ page }) => {
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  await login(page, staff.email, staff.password);
  await page.goto("/billing");
  await page.waitForURL(/\/dashboard/);
  const res = await page.goto("/platform");
  expect(res?.status()).toBe(404);
});

test("online booking: admin opens the page, a visitor sends a request, the team handles it", async ({ page, browser }) => {
  const agency = await createTestAgency();
  const plate = `WB${uid().slice(-4).toUpperCase()}-A-6`;
  await addVehicle(agency.agencyId, { plate, brand_model: "Peugeot 208", daily_rate: 320 });
  const { data: a } = await admin().from("agencies").select("slug").eq("id", agency.agencyId).single();
  const slug = a!.slug;

  // Closed by default
  const anon = await browser.newContext();
  const visitor = await anon.newPage();
  expect((await visitor.goto(`/r/${slug}`))?.status()).toBe(404);

  await login(page, agency.email, agency.password);
  await page.goto("/settings?section=booking");
  await page.getByRole("radio", { name: "Oui" }).click();
  await page.getByTestId("settings-booking").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByTestId("public-link")).toContainText(`/r/${slug}`);
  await expect
    .poll(async () => (await admin().from("agencies").select("public_booking_enabled").eq("id", agency.agencyId).single()).data?.public_booking_enabled)
    .toBe(true);

  await visitor.goto(`/r/${slug}`);
  await expect(visitor.getByTestId("public-cars")).toContainText("Peugeot 208");
  await expect(visitor.getByTestId("public-cars")).toContainText("320 MAD");
  await expect(visitor.getByTestId("public-cars")).not.toContainText(plate);
  await expectNoHorizontalScroll(visitor);
  const form = visitor.getByTestId("booking-form");
  await form.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(form.getByRole("alert").first()).toBeVisible(); // required fields
  await form.getByLabel("Date de départ").fill("2027-03-10");
  await form.getByLabel("Date de retour").fill("2027-03-14");
  await form.getByLabel("Voiture").selectOption({ label: "Peugeot 208 · 320 MAD" });
  await form.getByLabel("Nom complet").fill("Karim Visiteur");
  await form.getByLabel("Téléphone").fill("0661234567");
  // Every test run comes from the same address: forget earlier runs for the 5-per-hour limit.
  await admin().from("booking_requests").update({ ip_hash: null }).not("ip_hash", "is", null);
  await form.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(visitor.getByTestId("booking-done")).toBeVisible();
  await anon.close();

  await page.goto("/dashboard");
  await expect(page.getByTestId("dash-requests")).toContainText("1 nouvelle demande");
  await page.getByTestId("dash-requests").click();
  const row = page.getByTestId("request-row").filter({ hasText: "Karim Visiteur" });
  await expect(row).toContainText("Peugeot 208");
  await expectNoHorizontalScroll(page);
  await row.getByRole("button", { name: "Marquer traitée" }).click();
  await expect(row).toContainText("Traitée");
});
