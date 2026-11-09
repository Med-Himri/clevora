import { expect, test, type Page } from "@playwright/test";
import { addMember, addVehicle, admin, createTestAgency, expectNoHorizontalScroll, login, uid } from "./helpers";

async function setupAgency() {
  const agency = await createTestAgency();
  const staff = await addMember(agency.agencyId, "staff");
  const plate = `R${uid().slice(-5).toUpperCase()}-A-6`;
  const vehicleId = await addVehicle(agency.agencyId, { plate, brand_model: "Dacia Sandero", daily_rate: 300 });
  // A known client with one past rental
  const sb = admin();
  const cin = `AB${Math.floor(100000 + Math.random() * 899999)}`;
  const { data: client } = await sb
    .from("clients")
    .insert({ agency_id: agency.agencyId, full_name: "Karim Connu", phone: "+212600000099", id_type: "cin", id_number: cin, license_number: "P-12345", address: "Rue Test, Rabat" })
    .select("id")
    .single();
  await sb.from("reservations").insert({
    agency_id: agency.agencyId,
    vehicle_id: vehicleId,
    client_id: client!.id,
    start_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    end_at: new Date(Date.now() - 18 * 86_400_000).toISOString(),
    daily_price: 300,
    status: "returned",
    signed_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
  });
  return { agency, staff, plate, vehicleId, cin, clientId: client!.id };
}

async function goNext(page: Page) {
  await page.getByRole("button", { name: "Continuer" }).click();
}

test("new reservation: an existing CIN fills the client, the car list only shows free cars", async ({ page }) => {
  const s = await setupAgency();
  await login(page, s.staff.email, s.staff.password);
  await page.goto("/reservations/new");

  // Step 1 — dates (defaults: next hour → tomorrow) and car
  await expect(page.getByText("Étape 1 sur 4")).toBeVisible();
  await page.getByTestId("available-cars").getByRole("radio", { name: /Dacia Sandero/ }).click();
  await expectNoHorizontalScroll(page);
  await goNext(page);

  // Step 2 — the ID number is the first field and autofills everything
  await expect(page.getByText("Étape 2 sur 4")).toBeVisible();
  await page.getByLabel("Numéro de CIN").fill(`${s.cin.slice(0, 2).toLowerCase()}-${s.cin.slice(2, 5)} ${s.cin.slice(5)}`);
  await expect(page.getByText("Client trouvé : Karim Connu")).toBeVisible();
  await expect(page.getByLabel("Nom et prénom").first()).toHaveValue("Karim Connu");
  await expect(page.getByTestId("driver1-known")).toContainText("Client déjà connu · 1 location · dernière le");
  await page.getByLabel("Téléphone").first().fill("0661223344");
  await goNext(page);

  // Step 3 — price prefilled from the car, advance
  await expect(page.getByText("Étape 3 sur 4")).toBeVisible();
  await page.getByLabel("Avance payée").fill("100");
  await goNext(page);

  // Step 4 — check-out, then save
  await expect(page.getByText("Étape 4 sur 4")).toBeVisible();
  await page.getByRole("button", { name: "Enregistrer la réservation" }).click();
  await page.waitForURL(/\/reservations\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: /^Contrat C-\d+$/ })).toBeVisible();
  await expect(page.getByTestId("detail-balance")).toContainText("200 MAD");

  // Editing the autofilled phone updated the same client (no duplicate)
  const { data: clients } = await admin().from("clients").select("id, phone").eq("agency_id", s.agency.agencyId);
  expect(clients).toHaveLength(1);
  expect(clients![0].phone).toBe("+212661223344");

  // Same dates again: the car is not offered any more (no double booking)
  await page.goto("/reservations/new");
  await expect(page.getByTestId("unavailable-note")).toContainText("1 voiture indisponible : 1 déjà réservée(s)");
  await expect(page.getByTestId("available-cars").getByRole("radio", { name: /Dacia Sandero/ })).toHaveCount(0);
});

test("the contract number must be unique in the agency", async ({ page }) => {
  const s = await setupAgency();
  await admin().from("reservations").insert({
    agency_id: s.agency.agencyId,
    vehicle_id: s.vehicleId,
    client_id: s.clientId,
    contract_number: "P-0457",
    start_at: new Date(Date.now() + 40 * 86_400_000).toISOString(),
    end_at: new Date(Date.now() + 42 * 86_400_000).toISOString(),
    daily_price: 300,
  });
  await login(page, s.agency.email, s.agency.password);
  await page.goto("/reservations/new");
  await page.getByLabel("N° de contrat").fill("P-0457");
  await page.getByTestId("available-cars").getByRole("radio", { name: /Dacia Sandero/ }).click();
  await goNext(page);
  await expect(page.getByText("Ce numéro de contrat existe déjà dans votre agence.")).toBeVisible();
  await expect(page.getByText("Étape 1 sur 4")).toBeVisible();
});

test("sign, start, return: the car km is updated and the infraction finder knows who had it", async ({ page }) => {
  const s = await setupAgency();
  const start = new Date(Date.now() - 2 * 86_400_000);
  const { data: r } = await admin()
    .from("reservations")
    .insert({
      agency_id: s.agency.agencyId,
      vehicle_id: s.vehicleId,
      client_id: s.clientId,
      start_at: start.toISOString(),
      end_at: new Date(Date.now() + 86_400_000).toISOString(),
      daily_price: 300,
      km_out: 40000,
      fuel_out: 4,
      deposit_taken: true,
      deposit_amount: 2000,
    })
    .select("id, contract_number")
    .single();

  await login(page, s.staff.email, s.staff.password);
  await page.goto(`/reservations/${r!.id}`);
  await expect(page.getByRole("button", { name: "Démarrer la location" })).toBeDisabled();
  await page.getByRole("button", { name: "Marquer comme signé" }).click();
  await expect(page.getByText("Contrat marqué comme signé.")).toBeVisible();
  await page.getByRole("button", { name: "Démarrer la location" }).click();
  await expect(page.getByText("Location démarrée.")).toBeVisible();

  // From the list, "Retour" opens the return dialog directly
  await page.goto("/reservations");
  await page.getByTestId("returns").getByRole("link", { name: "Retour" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Kilométrage au retour").fill("40750");
  await dialog.getByRole("radio", { name: "3/4" }).click();
  await dialog.getByRole("button", { name: "Enregistrer le retour" }).click();
  await expect(page.getByText("Retour enregistré : la voiture est de nouveau disponible.")).toBeVisible();

  const { data: car } = await admin().from("vehicles").select("current_km").eq("id", s.vehicleId).single();
  expect(car!.current_km).toBe(40750);

  // Infraction finder: who had this car yesterday?
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  await page.goto(`/reservations?plate=${encodeURIComponent(s.plate.toLowerCase())}&date=${yesterday}`);
  const results = page.getByTestId("infraction-results");
  await expect(results).toContainText("Karim Connu");
  await expect(results).toContainText(r!.contract_number);
  await expect(results.getByRole("link", { name: "WhatsApp" })).toBeVisible();
});

test("search finds a reservation by phone, CIN or plate", async ({ page }) => {
  const s = await setupAgency();
  await login(page, s.agency.email, s.agency.password);
  for (const q of ["0600 000 099", s.cin.toLowerCase(), s.plate.replaceAll("-", " ")]) {
    await page.goto(`/reservations?q=${encodeURIComponent(q)}`);
    await expect(page.getByTestId("reservation-row").first()).toContainText("Karim Connu");
  }
});
