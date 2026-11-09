// Fails when a translation key exists in one language but not in the others.
import { readFileSync } from "node:fs";
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const sets = Object.fromEntries(["fr", "ar", "en"].map((l) => [l, new Set(flat(JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))))]));
let bad = false;
for (const l of ["ar", "en"]) {
  const missing = [...sets.fr].filter((k) => !sets[l].has(k));
  const extra = [...sets[l]].filter((k) => !sets.fr.has(k));
  if (missing.length || extra.length) {
    bad = true;
    console.error(`${l}: missing ${JSON.stringify(missing)} extra ${JSON.stringify(extra)}`);
  }
}
console.log(bad ? "✖ translation keys differ" : `✔ ${sets.fr.size} keys in fr, ar and en`);
process.exit(bad ? 1 : 0);
