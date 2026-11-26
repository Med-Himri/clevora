import { chromium, devices } from "playwright";
const [SP, path, name] = process.argv.slice(2);
const b = await chromium.launch();
for (const [dev, opts] of [["laptop", { viewport: { width: 1440, height: 1000 } }], ["phone", devices["iPhone 13"]]]) {
  for (const scheme of ["light", "dark"]) {
    if (dev === "phone" && scheme === "dark") continue;
    const ctx = await b.newContext({ ...opts, colorScheme: scheme, baseURL: "http://localhost:3000" });
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill("admin@demo.parcolia.ma");
    await page.getByLabel("Mot de passe", { exact: true }).fill("Demo-Parcolia-2026");
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await page.waitForURL(/dashboard/);
    await page.goto(path); await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SP}/${name}-${dev}-${scheme}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
