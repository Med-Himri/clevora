import { expect, test, type Page } from "@playwright/test";
import { addMember, addVehicle, admin, createTestAgency, expectNoHorizontalScroll, login, uid } from "./helpers";

const PHOTO = "e2e/fixtures/car-photo.jpg";
const VIDEO = "e2e/fixtures/car-video.webm";

/** "Prendre les photos": one tap per side (the camera opens; here a file stands in for it). */
async function photographFaces(page: Page) {
  await page.getByTestId("source-camera").click();
  for (const view of ["front", "back", "left", "right"]) {
    const chooser = page.waitForEvent("filechooser");
    await page.getByTestId(`photo-${view}`).click();
    await (await chooser).setFiles(PHOTO);
    await expect(page.getByTestId(`photo-${view}`).locator("img")).toBeVisible({ timeout: 20_000 });
  }
}

/** "Importer des photos": several files at once fill the empty boxes in order. */
async function importFaces(page: Page) {
  await page.getByTestId("source-files").click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByTestId("import-many").click();
  await (await chooser).setFiles([PHOTO, PHOTO, PHOTO, PHOTO]);
  await expect(page.getByText("4 photos importées.").first()).toBeVisible({ timeout: 40_000 });
  for (const view of ["front", "back", "left", "right"]) await expect(page.getByTestId(`photo-${view}`).locator("img")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("photo-wheels").locator("img")).toHaveCount(0);
}

/** An agency with one car out on rental, inspection turned on (photos or video). */
async function rentalWithInspection(mode: "photos" | "video") {
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  const car = await addVehicle(agency.agencyId, { plate: `I${uid().slice(-5).toUpperCase()}-A-6`, brand_model: "Hyundai Tucson" });
  const sb = admin();
  await sb.from("agencies").update({ inspection_enabled: true, inspection_mode: mode }).eq("id", agency.agencyId);
  const { data: client } = await sb.from("clients").insert({ agency_id: agency.agencyId, full_name: "Client Inspection", id_type: "cin", id_number: `IN${Math.floor(100000 + Math.random() * 899999)}` }).select("id").single();
  const { data: r } = await sb
    .from("reservations")
    .insert({ agency_id: agency.agencyId, vehicle_id: car, client_id: client!.id, daily_price: 400, status: "on_rental", signed_at: new Date(Date.now() - 86_400_000).toISOString(), start_at: new Date(Date.now() - 86_400_000).toISOString(), end_at: new Date(Date.now() + 86_400_000).toISOString() })
    .select("id")
    .single();
  return { agency, staff, id: r!.id };
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
  const { agency, staff, id } = await rentalWithInspection("photos");
  const sb = admin();
  const r = { id };

  // Its own section in the menu: the car out on rental waits for its return inspection
  await login(page, staff.email, staff.password);
  await page.goto("/inspections");
  await expect(page.getByTestId("inspections-returns").getByTestId("inspection-row").filter({ visible: true })).toContainText("Hyundai Tucson");
  await page.goto(`/inspections/${r.id}`);
  const card = page.getByTestId("inspection-card");
  await expect(card.getByTestId("inspection-departure")).toContainText("À faire");

  // Departure: 4 faces + a scratch at the front
  await card.getByTestId("inspection-departure").getByRole("link", { name: "Faire l'inspection" }).click();
  await page.waitForURL(/\/inspections\/[0-9a-f-]{36}\/departure$/);
  await expect(page.getByTestId("inspection-finish")).toBeDisabled();
  await photographFaces(page);
  await expectNoHorizontalScroll(page);
  await markDamage(page, 0.3, 0.12, "Rayure");
  await page.getByTestId("inspection-finish").click();
  await page.waitForURL(new RegExp(`/inspections/${r.id}$`));
  await expect(card.getByTestId("inspection-departure")).toContainText("Documenté · 4 photos");

  // Return: same scratch (already there) + a new dent on the right side
  await card.getByTestId("inspection-return").getByRole("link", { name: "Faire l'inspection" }).click();
  await page.waitForURL(/\/inspections\/[0-9a-f-]{36}\/return$/);
  await importFaces(page);
  await markDamage(page, 0.3, 0.12, "Rayure");
  await markDamage(page, 0.85, 0.55, "Bosse / choc");
  await page.getByTestId("inspection-finish").click();
  await page.waitForURL(new RegExp(`/inspections/${r.id}$`));
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

test("inspection is off by default: no menu item; an admin turns it on with the video mode", async ({ page }, testInfo) => {
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  await login(page, staff.email, staff.password);
  await page.goto("/inspections");
  await expect(page.getByText("L'inspection n'est pas activée")).toBeVisible();
  await expect(page.getByText("Demandez à un administrateur")).toBeVisible();
  const menu = async () => {
    if (testInfo.project.name === "phone") await page.getByRole("button", { name: "Plus" }).click();
    return page.locator('a[href$="/inspections"]').filter({ visible: true });
  };
  await expect(await menu()).toHaveCount(0);

  await page.context().clearCookies();
  await login(page, agency.email, agency.password);
  await page.goto("/settings?section=inspection");
  await page.getByRole("radiogroup", { name: "Utiliser l'inspection des voitures ?" }).getByRole("radio", { name: "Oui" }).click();
  await page.getByRole("radio", { name: /^Vidéo/ }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées").first()).toBeVisible();
  const { data } = await admin().from("agencies").select("inspection_enabled, inspection_mode").eq("id", agency.agencyId).single();
  expect(data).toEqual({ inspection_enabled: true, inspection_mode: "video" });
  await page.goto("/inspections");
  await expect(page.getByText("Mode vidéo")).toBeVisible();
  await expect((await menu()).first()).toBeVisible();
});

test("video mode: one video at departure and at return, shown side by side, no AI", async ({ page }) => {
  test.setTimeout(120_000);
  const { agency, staff, id } = await rentalWithInspection("video");
  await login(page, staff.email, staff.password);
  for (const kind of ["departure", "return"] as const) {
    await page.goto(`/inspections/${id}/${kind}`);
    await expect(page.getByTestId("inspection-photos")).toHaveCount(0);
    await expect(page.getByTestId("inspection-finish")).toBeDisabled();
    // Departure filmed with "Filmer maintenant" would need a real camera: both use "Importer une vidéo" here
    await page.getByTestId("source-files").click();
    const chooser = page.waitForEvent("filechooser");
    await page.getByTestId("video-pick").click();
    await (await chooser).setFiles(VIDEO);
    await expect(page.getByTestId("inspection-video-player")).toBeVisible({ timeout: 20_000 });
    // It really plays (the security rules allow private video links)
    await expect.poll(() => page.getByTestId("inspection-video-player").evaluate((v: HTMLVideoElement) => (v.error ? -1 : v.readyState)), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
    await expectNoHorizontalScroll(page);
    await page.getByTestId("inspection-finish").click();
    await page.waitForURL(new RegExp(`/inspections/${id}$`));
  }
  const card = page.getByTestId("inspection-card");
  await expect(card.getByTestId("inspection-departure")).toContainText("Documenté · vidéo");
  await expect(card.getByTestId("inspection-return")).toContainText("Documenté · vidéo");
  await expect(page.getByTestId("inspection-videos").locator("video")).toHaveCount(2);
  await expect(page.getByTestId("ai-compare")).toHaveCount(0);
  const { data } = await admin().from("inspections").select("mode, video_path").eq("reservation_id", id);
  expect(data).toHaveLength(2);
  for (const i of data!) {
    expect(i.mode).toBe("video");
    expect(i.video_path!.startsWith(`${agency.agencyId}/inspections/`)).toBe(true);
  }
});
