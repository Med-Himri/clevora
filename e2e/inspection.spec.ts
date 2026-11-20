import { expect, test, type Page } from "@playwright/test";
import { addMember, addVehicle, admin, createTestAgency, expectNoHorizontalScroll, login, uid } from "./helpers";

const PHOTO = "e2e/fixtures/car-photo.jpg";

async function photographFaces(page: Page) {
  for (const view of ["front", "back", "left", "right"]) {
    await page.getByTestId(`photo-${view}`).click();
    await page.getByTestId("inspection-file").setInputFiles(PHOTO);
    await expect(page.getByTestId(`photo-${view}`).locator("img")).toBeVisible({ timeout: 20_000 });
  }
}

async function markDamage(page: Page, x: number, y: number, type: string) {
  const diagram = page.getByTestId("inspection-diagram");
  await diagram.scrollIntoViewIfNeeded();
  const box = (await diagram.boundingBox())!;
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  await page.getByRole("dialog").getByRole("radio", { name: type }).click();
  await page.getByTestId("damage-save").click();
  await expect(page.getByText("Dégât noté.").first()).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("inspection départ / retour: photos, marks, AI suggestion confirmed, new damage counted", async ({ page }) => {
  test.setTimeout(150_000);
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  const car = await addVehicle(agency.agencyId, { plate: `I${uid().slice(-5).toUpperCase()}-A-6`, brand_model: "Hyundai Tucson" });
  const sb = admin();
  const { data: client } = await sb.from("clients").insert({ agency_id: agency.agencyId, full_name: "Client Inspection", id_type: "cin", id_number: `IN${Math.floor(100000 + Math.random() * 899999)}` }).select("id").single();
  const { data: r } = await sb
    .from("reservations")
    .insert({ agency_id: agency.agencyId, vehicle_id: car, client_id: client!.id, daily_price: 400, status: "on_rental", signed_at: new Date(Date.now() - 86_400_000).toISOString(), start_at: new Date(Date.now() - 86_400_000).toISOString(), end_at: new Date(Date.now() + 86_400_000).toISOString() })
    .select("id")
    .single();

  await login(page, staff.email, staff.password);
  await page.goto(`/contracts/${r!.id}`);
  const card = page.getByTestId("inspection-card");
  await expect(card.getByTestId("inspection-departure")).toContainText("À faire");

  // Departure: 4 faces + a scratch at the front
  await card.getByTestId("inspection-departure").getByRole("link", { name: "Faire l'inspection" }).click();
  await page.waitForURL(/\/inspection\/departure/);
  await expect(page.getByTestId("inspection-finish")).toBeDisabled();
  await photographFaces(page);
  await expectNoHorizontalScroll(page);
  await markDamage(page, 0.3, 0.12, "Rayure");
  await page.getByTestId("inspection-finish").click();
  await page.waitForURL(new RegExp(`/contracts/${r!.id}$`));
  await expect(card.getByTestId("inspection-departure")).toContainText("Documenté · 4 photos");

  // Return: same scratch (already there) + a new dent on the right side
  await card.getByTestId("inspection-return").getByRole("link", { name: "Faire l'inspection" }).click();
  await page.waitForURL(/\/inspection\/return/);
  await photographFaces(page);
  await markDamage(page, 0.3, 0.12, "Rayure");
  await markDamage(page, 0.85, 0.55, "Bosse / choc");
  await page.getByTestId("inspection-finish").click();
  await page.waitForURL(new RegExp(`/contracts/${r!.id}$`));
  await expect(page.getByTestId("inspection-result")).toContainText("1 nouveau dégât au retour");

  // AI comparison (test AI): one suggestion on the right side, confirmed by staff
  await page.getByTestId("ai-compare").click();
  const sugg = page.getByTestId("ai-suggestions");
  await expect(sugg).toContainText("1 suggestion de l'IA à vérifier", { timeout: 30_000 });
  await sugg.getByRole("button", { name: /Confirmer le repère/ }).click();
  await expect(page.getByText("Dégât confirmé.")).toBeVisible();
  await expect(page.getByTestId("inspection-result")).toContainText("2 nouveaux dégâts au retour");
  await expectNoHorizontalScroll(page);

  // Photos are private: the database only holds paths inside this agency's folder
  const { data: photos } = await sb.from("inspection_photos").select("storage_path").eq("agency_id", agency.agencyId);
  expect(photos).toHaveLength(8);
  for (const p of photos!) expect(p.storage_path.startsWith(`${agency.agencyId}/inspections/`)).toBe(true);
});
