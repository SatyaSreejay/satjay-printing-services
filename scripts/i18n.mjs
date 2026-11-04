// Translation helper.
//   node scripts/i18n.mjs check    -> fails if te/hi miss keys or placeholders
//   node scripts/i18n.mjs review   -> writes docs/TRANSLATIONS_REVIEW.md
import { readFileSync, writeFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));
function* flat(o, p = "") {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === "object") yield* flat(v, `${p}${k}.`);
    else yield [`${p}${k}`, String(v)];
  }
}
const en = new Map(flat(load("en")));
const others = { te: new Map(flat(load("te"))), hi: new Map(flat(load("hi"))) };
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

const mode = process.argv[2] ?? "check";
if (mode === "check") {
  let bad = 0;
  for (const [l, m] of Object.entries(others)) {
    for (const [k, v] of en) {
      if (!m.has(k)) { console.error(`${l}: missing ${k}`); bad++; }
      else if (vars(v) !== vars(m.get(k))) { console.error(`${l}: placeholders differ in ${k}`); bad++; }
    }
    for (const k of m.keys()) if (!en.has(k)) { console.error(`${l}: extra key ${k}`); bad++; }
  }
  if (bad) process.exit(1);
  console.log(`OK: ${en.size} keys, te and hi complete.`);
} else if (mode === "review") {
  const cell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  const sections = new Map();
  for (const [k, v] of en) {
    const top = k.split(".")[0];
    if (!sections.has(top)) sections.set(top, []);
    sections.get(top).push([k, v]);
  }
  let out = `# Translation review: Telugu and Hindi\n\nThese are machine-drafted translations and need a native speaker's review before launch.\nEdit the text in \`messages/te.json\` and \`messages/hi.json\` (same keys as \`messages/en.json\`), then run \`npm run i18n:review\` to refresh this file and \`npm run i18n:check\` to confirm nothing is missing.\n\nWords in {braces} are filled in by the site (names, numbers) and must stay exactly as they are.\nThe \`templates.samples\` rows are demo text shown in the design studio.\n\nTotal strings: ${en.size}\n\n`;
  for (const [top, rows] of sections) {
    out += `## ${top}\n\n| Key | English | Telugu | Hindi |\n|---|---|---|---|\n`;
    for (const [k, v] of rows) out += `| \`${k}\` | ${cell(v)} | ${cell(others.te.get(k) ?? "")} | ${cell(others.hi.get(k) ?? "")} |\n`;
    out += "\n";
  }
  writeFileSync(new URL("../docs/TRANSLATIONS_REVIEW.md", import.meta.url), out);
  console.log("Wrote docs/TRANSLATIONS_REVIEW.md");
}
