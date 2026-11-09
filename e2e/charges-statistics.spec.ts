import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { addMember, addVehicle, admin, createTestAgency, DEMO, expectNoHorizontalScroll, login, uid } from "./helpers";

test("charges: add a monthly agency charge and a car charge with a receipt; totals follow", async ({ page }, testInfo) => {
  const agency = await createTestAgency();
  await addVehicle(agency.agencyId, { plate: `CH${uid().slice(-4).toUpperCase()}-A-6`, brand_model: "Toyota Yaris" });
  await login(page, agency.email, agency.password);
  await page.goto("/charges");
  await expect(page.getByText("Aucune charge ce mois-ci")).toBeVisible();

  await page.getByRole("button", { name: "Ajouter une charge" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Loyer" }).click();
  await dialog.getByLabel("Montant").fill("6000");
  await dialog.getByRole("radio", { name: "Oui" }).click(); // monthly
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();

  const receipt = testInfo.outputPath("recu.png");
  writeFileSync(receipt, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
  await page.getByRole("button", { name: "Ajouter une charge" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Lavage" }).click();
  await dialog.getByLabel("Montant").fill("80");
  await dialog.getByRole("radio", { name: "Une voiture" }).click();
  await dialog.getByLabel("Choisir la voiture").selectOption({ index: 1 });
  await dialog.locator("#charge-receipt").setInputFiles(receipt);
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();

  await expect(page.getByTestId("charges-total")).toHaveText("6 080 MAD");
  await expect(page.getByTestId("charges-list")).toContainText("Mensuelle");
  await expect(page.getByTestId("charge-row").filter({ hasText: "Toyota Yaris" }).getByRole("button", { name: "Reçu" })).toBeVisible();
  await expectNoHorizontalScroll(page);

  const { data } = await admin().from("charges").select("receipt_path").eq("agency_id", agency.agencyId).not("receipt_path", "is", null);
  expect(data?.[0]?.receipt_path).toMatch(new RegExp(`^${agency.agencyId}/charges/`));
});

test("statistics: tiles, chart, per-car ranking and the PDF report (admins only)", async ({ page }) => {
  await login(page, DEMO.admin.email, DEMO.admin.password);
  await page.goto("/statistics?period=days");
  await expect(page.getByTestId("stats-revenue")).toContainText("MAD");
  await expect(page.getByTestId("revenue-chart").locator(".recharts-bar-rectangle").first()).toBeVisible();
  await expect(page.getByTestId("per-car")).toContainText("Dacia Logan");
  await expectNoHorizontalScroll(page);
  const pdf = await page.request.get("/api/statistics/pdf?period=months");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
});

test("staff can see neither charges nor statistics (page, PDF or database)", async ({ page }) => {
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  await login(page, staff.email, staff.password);
  for (const path of ["/charges", "/statistics"]) {
    await page.goto(path);
    await page.waitForURL(/\/dashboard/);
  }
  expect((await page.request.get("/api/statistics/pdf")).status()).toBe(403);
});
