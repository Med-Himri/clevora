/**
 * Makes 16 test photos for the inspection: 8 at departure, 8 at return, same white
 * car. The return photos have 6 new damages (listed in test-data/inspection/README.md);
 * "right" and "roof" have none (to check the AI does not invent damages).
 * Run: node scripts/test-photos/make-inspection-photos.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1600;
const H = 1200;
const OUT = "test-data/inspection";

const defs = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#dfeaf2"/></linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b7f84"/><stop offset="1" stop-color="#55595e"/></linearGradient>
  <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eceff2"/><stop offset="1" stop-color="#c9ced4"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b4a5a"/><stop offset=".5" stop-color="#5d7184"/><stop offset="1" stop-color="#2a3540"/></linearGradient>
  <radialGradient id="tyre"><stop offset=".6" stop-color="#2a2a2a"/><stop offset="1" stop-color="#111"/></radialGradient>
  <radialGradient id="rim"><stop offset="0" stop-color="#e6e8ea"/><stop offset="1" stop-color="#9aa0a6"/></radialGradient>
  <radialGradient id="dent" cx=".45" cy=".4"><stop offset="0" stop-color="#8d949b" stop-opacity=".9"/><stop offset=".55" stop-color="#b9bfc5" stop-opacity=".7"/><stop offset="1" stop-color="#eceff2" stop-opacity="0"/></radialGradient>
  <radialGradient id="stain" cx=".5" cy=".5"><stop offset="0" stop-color="#5a3a1c" stop-opacity=".85"/><stop offset=".7" stop-color="#6b4826" stop-opacity=".55"/><stop offset="1" stop-color="#6b4826" stop-opacity="0"/></radialGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;

const parking = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<rect y="520" width="${W}" height="${H - 520}" fill="url(#ground)"/>
<rect y="500" width="${W}" height="30" fill="#b9b3a6"/>
<g stroke="#e9e4c9" stroke-width="10" opacity=".8"><line x1="80" y1="1150" x2="230" y2="640"/><line x1="1520" y1="1150" x2="1370" y2="640"/></g>`;

const plate = (x, y) => `
<g transform="translate(${x} ${y})"><rect width="260" height="60" rx="6" fill="#fff" stroke="#222" stroke-width="3"/>
<text x="130" y="42" font-family="Arial" font-size="34" font-weight="700" text-anchor="middle" fill="#111">12345 | أ | 6</text></g>`;

const wheel = (cx, cy, r) => `
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#tyre)"/><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="url(#rim)"/>
${[0, 72, 144, 216, 288].map((a) => `<rect x="${cx - 9}" y="${cy - r * 0.58}" width="18" height="${r * 0.5}" rx="6" fill="#80868c" transform="rotate(${a} ${cx} ${cy})"/>`).join("")}
<circle cx="${cx}" cy="${cy}" r="${r * 0.14}" fill="#5f656b"/>`;

/** Side of the car, FRONT ON THE LEFT (left side photo). */
function side(damaged) {
  const scratch = damaged
    ? `<g stroke-linecap="round"><path d="M820 640 L900 655 L985 648 L1060 668" stroke="#5f666d" stroke-width="5" fill="none"/>
       <path d="M826 650 L905 664 L990 657 L1062 678" stroke="#9aa1a8" stroke-width="3" fill="none"/>
       <path d="M860 632 L940 646" stroke="#6c737a" stroke-width="3" fill="none"/></g>`
    : "";
  return `${parking}
<ellipse cx="800" cy="900" rx="640" ry="40" fill="#000" opacity=".35" filter="url(#soft)"/>
<path d="M190 820 L190 700 Q200 640 300 620 L520 590 Q600 470 720 450 L1040 450 Q1150 455 1230 580 L1380 610 Q1430 625 1430 700 L1430 820 Z" fill="url(#body)" stroke="#9aa0a6" stroke-width="3"/>
<path d="M560 590 Q630 485 730 475 L860 475 L860 590 Z" fill="url(#glass)"/>
<path d="M880 475 L1030 475 Q1120 480 1190 590 L880 590 Z" fill="url(#glass)"/>
<line x1="870" y1="470" x2="870" y2="820" stroke="#a4aab0" stroke-width="3"/>
<line x1="1210" y1="600" x2="1210" y2="800" stroke="#a4aab0" stroke-width="3"/>
<line x1="540" y1="600" x2="540" y2="800" stroke="#a4aab0" stroke-width="3"/>
<rect x="760" y="640" width="60" height="14" rx="7" fill="#b3b9bf"/><rect x="1100" y="640" width="60" height="14" rx="7" fill="#b3b9bf"/>
<path d="M520 595 L470 570 L470 600 Z" fill="#cfd4d9" stroke="#999"/>
<rect x="190" y="700" width="30" height="40" rx="6" fill="#f4b84a"/><rect x="1400" y="690" width="30" height="45" rx="6" fill="#c0392b"/>
<path d="M200 800 L1420 800" stroke="#b4bac0" stroke-width="6"/>
${wheel(420, 820, 115)}${wheel(1200, 820, 115)}${scratch}`;
}

function front(damaged) {
  const crack = damaged
    ? `<g stroke="#e8f2fa" stroke-width="3" fill="none" opacity=".95"><path d="M960 400 L1010 340"/><path d="M960 400 L1050 405"/><path d="M960 400 L1000 470"/><path d="M960 400 L905 445"/><path d="M960 400 L900 360"/><path d="M1010 340 L1040 300"/><path d="M1050 405 L1110 380"/></g><circle cx="960" cy="400" r="8" fill="#eef6fc"/>`
    : "";
  return `${parking}
<ellipse cx="800" cy="960" rx="560" ry="40" fill="#000" opacity=".35" filter="url(#soft)"/>
<path d="M290 940 L290 640 Q300 560 400 540 L480 380 Q500 330 560 325 L1040 325 Q1100 330 1120 380 L1200 540 Q1300 560 1310 640 L1310 940 Z" fill="url(#body)" stroke="#9aa0a6" stroke-width="3"/>
<path d="M500 530 L570 360 L1030 360 L1100 530 Z" fill="url(#glass)"/>
<rect x="330" y="610" width="250" height="80" rx="30" fill="#e9f2fb" stroke="#8e969d" stroke-width="4"/><rect x="1020" y="610" width="250" height="80" rx="30" fill="#e9f2fb" stroke="#8e969d" stroke-width="4"/>
<rect x="640" y="620" width="320" height="90" rx="20" fill="#2f3439"/>
<g stroke="#555b61" stroke-width="5">${[645, 670, 695].map((y) => `<line x1="660" y1="${y}" x2="940" y2="${y}"/>`).join("")}</g>
${plate(670, 760)}
<rect x="290" y="850" width="1020" height="90" fill="#3a3f44"/>
<rect x="290" y="900" width="140" height="80" rx="10" fill="#1d1d1d"/><rect x="1170" y="900" width="140" height="80" rx="10" fill="#1d1d1d"/>${crack}`;
}

function back(damaged) {
  const dent = damaged
    ? `<ellipse cx="1060" cy="835" rx="95" ry="55" fill="url(#dent)"/><path d="M1010 830 Q1060 800 1110 835" stroke="#7c838a" stroke-width="3" fill="none"/><path d="M1030 860 L1080 850" stroke="#555" stroke-width="2"/>`
    : "";
  return `${parking}
<ellipse cx="800" cy="960" rx="560" ry="40" fill="#000" opacity=".35" filter="url(#soft)"/>
<path d="M290 940 L290 620 Q300 560 400 545 L500 380 Q520 335 580 330 L1020 330 Q1080 335 1100 380 L1200 545 Q1300 560 1310 620 L1310 940 Z" fill="url(#body)" stroke="#9aa0a6" stroke-width="3"/>
<path d="M530 535 L590 370 L1010 370 L1070 535 Z" fill="url(#glass)"/>
<rect x="310" y="600" width="230" height="110" rx="18" fill="#b3261e" stroke="#7a1712" stroke-width="4"/><rect x="1060" y="600" width="230" height="110" rx="18" fill="#b3261e" stroke="#7a1712" stroke-width="4"/>
<rect x="360" y="625" width="90" height="40" rx="8" fill="#f0a39d"/><rect x="1150" y="625" width="90" height="40" rx="8" fill="#f0a39d"/>
${plate(670, 640)}
<text x="800" y="590" font-family="Arial" font-size="30" font-weight="700" text-anchor="middle" fill="#8c939a" letter-spacing="6">LOGAN</text>
<rect x="290" y="780" width="1020" height="130" rx="20" fill="url(#body)" stroke="#a4aab0" stroke-width="3"/>
<rect x="290" y="900" width="140" height="80" rx="10" fill="#1d1d1d"/><rect x="1170" y="900" width="140" height="80" rx="10" fill="#1d1d1d"/>${dent}`;
}

/** Close-up of the front-left wheel. */
function wheels(damaged) {
  const cx = 800;
  const cy = 640;
  const rash = damaged
    ? `<path d="M${cx + 190} ${cy + 230} A 300 300 0 0 0 ${cx + 290} ${cy + 80}" stroke="#d8d1c4" stroke-width="16" fill="none" stroke-dasharray="22 10 8 14"/>
       <path d="M${cx + 205} ${cy + 215} A 290 290 0 0 0 ${cx + 280} ${cy + 100}" stroke="#6f655a" stroke-width="5" fill="none"/>`
    : "";
  return `<rect width="${W}" height="${H}" fill="url(#body)"/>
<path d="M0 0 H${W} V180 Q800 110 0 180 Z" fill="#d4d9de"/>
<circle cx="${cx}" cy="${cy + 40}" r="520" fill="#1a1a1a"/>
<circle cx="${cx}" cy="${cy}" r="480" fill="url(#tyre)"/>
<g stroke="#262626" stroke-width="10">${Array.from({ length: 36 }, (_, i) => `<line x1="${cx}" y1="${cy - 480}" x2="${cx}" y2="${cy - 440}" transform="rotate(${i * 10} ${cx} ${cy})"/>`).join("")}</g>
<circle cx="${cx}" cy="${cy}" r="310" fill="url(#rim)" stroke="#8a9096" stroke-width="6"/>
${[0, 72, 144, 216, 288].map((a) => `<path d="M${cx - 35} ${cy - 70} L${cx - 55} ${cy - 290} L${cx + 55} ${cy - 290} L${cx + 35} ${cy - 70} Z" fill="#a3a9af" stroke="#7c8288" stroke-width="3" transform="rotate(${a} ${cx} ${cy})"/>`).join("")}
<circle cx="${cx}" cy="${cy}" r="70" fill="#6b7177"/><circle cx="${cx}" cy="${cy}" r="30" fill="#4b5157"/>
<text x="${cx}" y="${cy - 400}" font-family="Arial" font-size="38" fill="#3a3a3a" text-anchor="middle" font-weight="700">185/65 R15</text>${rash}`;
}

/** Roof seen from above (no damage at return). */
function roof() {
  return `<rect width="${W}" height="${H}" fill="#6b7075"/>
<rect x="300" y="120" width="1000" height="960" rx="140" fill="url(#body)" stroke="#9aa0a6" stroke-width="4"/>
<path d="M380 160 L1220 160 L1180 330 L420 330 Z" fill="url(#glass)"/>
<path d="M420 900 L1180 900 L1220 1040 L380 1040 Z" fill="url(#glass)"/>
<rect x="420" y="330" width="760" height="570" rx="40" fill="#f3f5f7" stroke="#c3c8ce" stroke-width="3"/>
<rect x="470" y="380" width="22" height="470" rx="10" fill="#2f3439"/><rect x="1108" y="380" width="22" height="470" rx="10" fill="#2f3439"/>
<rect x="760" y="860" width="80" height="30" rx="10" fill="#2f3439"/>`;
}

/** Front seats from the back door. */
function interior(damaged) {
  const stain = damaged ? `<ellipse cx="1080" cy="820" rx="120" ry="80" fill="url(#stain)"/><ellipse cx="1150" cy="870" rx="40" ry="26" fill="url(#stain)"/>` : "";
  return `<rect width="${W}" height="${H}" fill="#2b2e31"/>
<rect y="0" width="${W}" height="300" fill="#3a3e42"/>
<path d="M0 300 Q800 200 1600 300 L1600 470 L0 470 Z" fill="#26292c"/>
<rect x="680" y="320" width="240" height="110" rx="12" fill="#111"/><rect x="700" y="340" width="200" height="70" rx="6" fill="#1f3b52"/>
<circle cx="420" cy="420" r="120" fill="none" stroke="#151515" stroke-width="34"/><circle cx="420" cy="420" r="40" fill="#151515"/>
<g fill="#4a4f55" stroke="#30343a" stroke-width="4">
  <path d="M260 500 Q260 450 330 450 L560 450 Q630 450 630 500 L640 1100 L250 1100 Z"/><rect x="320" y="380" width="250" height="110" rx="40"/>
  <path d="M900 500 Q900 450 970 450 L1200 450 Q1270 450 1270 500 L1280 1100 L890 1100 Z"/><rect x="960" y="380" width="250" height="110" rx="40"/>
</g>
<g stroke="#3b4046" stroke-width="5">${[620, 740, 860, 980].map((y) => `<line x1="280" y1="${y}" x2="620" y2="${y}"/><line x1="920" y1="${y}" x2="1260" y2="${y}"/>`).join("")}</g>
<rect x="690" y="560" width="160" height="540" rx="20" fill="#1c1f22"/><rect x="740" y="640" width="60" height="120" rx="16" fill="#0f1113"/>${stain}`;
}

/** Open trunk: spare wheel cover, warning triangle, jack bag. The triangle is missing at return. */
function trunk(damaged) {
  const triangle = damaged
    ? ""
    : `<g transform="translate(1040 640)"><path d="M0 220 L130 0 L260 220 Z" fill="none" stroke="#d7261e" stroke-width="28" stroke-linejoin="round"/><path d="M60 190 L130 70 L200 190 Z" fill="none" stroke="#f0f0f0" stroke-width="8" opacity=".7"/></g>`;
  return `<rect width="${W}" height="${H}" fill="#6b7075"/>
<path d="M120 60 L1480 60 L1540 240 L60 240 Z" fill="url(#body)" stroke="#9aa0a6" stroke-width="4"/>
<path d="M200 90 L1400 90 L1440 210 L160 210 Z" fill="url(#glass)"/>
<path d="M140 260 L1460 260 L1400 1000 L200 1000 Z" fill="#1f2225"/>
<path d="M230 340 L1370 340 L1330 940 L270 940 Z" fill="#33373b"/>
<g stroke="#2a2e32" stroke-width="3" opacity=".7">${Array.from({ length: 20 }, (_, i) => `<line x1="${260 + i * 55}" y1="350" x2="${290 + i * 52}" y2="930"/>`).join("")}</g>
<rect x="360" y="660" width="420" height="200" rx="40" fill="#24282c" stroke="#16191c" stroke-width="5"/>
<text x="570" y="775" font-family="Arial" font-size="34" fill="#80868c" text-anchor="middle">CRIC</text>
${triangle}
<rect x="200" y="1000" width="1200" height="90" rx="20" fill="url(#body)" stroke="#9aa0a6" stroke-width="3"/>`;
}

const VIEWS = {
  front,
  back,
  left: side,
  // Right side: same car mirrored, front on the photo's right. No damage.
  right: () => `<g transform="translate(${W} 0) scale(-1 1)">${side(false)}</g>`,
  wheels,
  roof,
  interior,
  trunk,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const [dir, damaged, shift] of [
  ["depart", false, { dx: 0, dy: 0, light: 1 }],
  // Return photos: taken a little later, slightly moved camera and other light (must be ignored).
  ["retour", true, { dx: 14, dy: -10, light: 0.94 }],
]) {
  mkdirSync(`${OUT}/${dir}`, { recursive: true });
  let i = 1;
  for (const [view, draw] of Object.entries(VIEWS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}
      <g style="filter:brightness(${shift.light})"><g transform="translate(${shift.dx} ${shift.dy}) scale(1.01)">${draw(damaged)}</g></g></svg>`;
    await page.setContent(`<html><body style="margin:0;background:#666">${svg}</body></html>`);
    writeFileSync(`${OUT}/${dir}/${i}-${view}.jpg`, await page.screenshot({ type: "jpeg", quality: 85 }));
    i++;
  }
}
await browser.close();
console.log(`16 photos in ${OUT}/depart and ${OUT}/retour`);
