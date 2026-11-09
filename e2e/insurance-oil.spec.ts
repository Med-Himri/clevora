import { expect, test } from "@playwright/test";
import { addMember, addVehicle, admin, createTestAgency, DEMO, expectNoHorizontalScroll, latestEmailHtml, login, uid } from "./helpers";

test("insurance: grouped by urgency; +1 an only prefills, then saving moves the car to OK", async ({ page }) => {
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  const plate = `AS${uid().slice(-4).toUpperCase()}-A-6`;
  const id = await addVehicle(agency.agencyId, { plate, brand_model: "Kia Rio" });
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  await admin().from("vehicles").update({ insurance_expires_on: yesterday, technical_visit_expires_on: "2099-01-01" }).eq("id", id);

  await login(page, staff.email, staff.password);
  await page.goto("/insurance");
  const expired = page.locator("[data-group='expired']");
  await expect(expired).toContainText("Kia Rio");
  await expect(expired).toContainText("Expirée");
  await expectNoHorizontalScroll(page);

  await expired.getByRole("button", { name: "Modifier" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "+1 an" }).first().click();
  const filled = await dialog.getByLabel("Fin de l'assurance").inputValue();
  expect(filled > yesterday).toBe(true);
  await dialog.getByLabel("Assureur (facultatif)").fill("Wafa Assurance");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
  await expect(page.locator("[data-group='later']")).toContainText("Wafa Assurance");
});

test("a car with expired insurance is not offered for booking, and the wizard says why", async ({ page }) => {
  await login(page, DEMO.staff.email, DEMO.staff.password);
  await page.goto("/reservations/new");
  await expect(page.getByTestId("unavailable-note")).toContainText("avec une assurance qui finit avant le retour");
  await expect(page.getByTestId("available-cars")).not.toContainText("Kia Picanto");
});

test("vidange: the last interval is only a suggestion; saving updates km left", async ({ page }) => {
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  const id = await addVehicle(agency.agencyId, { plate: `VD${uid().slice(-4).toUpperCase()}-A-6`, brand_model: "Fiat Tipo" });
  await admin().from("vehicles").update({ current_km: 40000, oil_last_km: 30500, oil_next_km: 40500 }).eq("id", id);

  await login(page, staff.email, staff.password);
  await page.goto("/oil");
  const row = page.getByTestId("oil-row").filter({ hasText: "Fiat Tipo" });
  await expect(page.locator("[data-group='soon']")).toContainText("Fiat Tipo");
  await expect(row.getByTestId("oil-km-left")).toHaveText("Dans 500 km");

  await row.getByRole("button", { name: "Vidange faite" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Prochaine vidange (km)")).toHaveValue("");
  await expect(dialog.getByLabel("Coût (facultatif)")).toHaveCount(0); // staff never record money
  await dialog.getByRole("button", { name: /Même intervalle que la dernière fois/ }).click();
  await expect(dialog.getByLabel("Prochaine vidange (km)")).toHaveValue("50000");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Vidange enregistrée.")).toBeVisible();
  await expect(page.locator("[data-group='ok']")).toContainText("Fiat Tipo");
  await expect(page.getByTestId("oil-row").filter({ hasText: "Fiat Tipo" }).getByTestId("oil-km-left")).toHaveText("Dans 10 000 km");
});

test("daily alert email: protected by a secret, sent to admins, in their language", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "laptop", "one run is enough");
  expect((await request.get("/api/cron/daily-alerts")).status()).toBe(401);

  const { data: agency } = await admin().from("agencies").select("id").eq("slug", "agence-demo").single();
  const res = await request.get(`/api/cron/daily-alerts?agency=${agency!.id}&force=1`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.report[0].alerts).toBeGreaterThan(0);
  expect(body.report[0].sent).toBe(1); // alert_roles = admin only

  const html = await latestEmailHtml(DEMO.admin.email);
  expect(html).toContain("Agence Démo");
  expect(html).toContain("Kia Picanto");
  expect(html).toContain("Propulsé par Parcolia");

  // Already sent today: not sent twice
  const again = await request.get(`/api/cron/daily-alerts?agency=${agency!.id}`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect((await again.json()).report[0].skipped).toBe("already_sent");
});
