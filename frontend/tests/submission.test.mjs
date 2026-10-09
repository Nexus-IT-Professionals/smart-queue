import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// DEP-3: keep the judge-facing submission page honest. Required sections, a
// 2–3 sentence description, working relative links, feature rows backed by
// real test titles, every package credited in the README, and no contact data.
const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(join(repo, path), "utf8");

export const REQUIRED_SECTIONS = [
  "Project name",
  "Team",
  "Description",
  "Links",
  "How to review",
  "Run locally",
  "Feature status",
];
export const STATUSES = ["Working", "Simulated", "Planned"];
const PRESENTATION_URL = "https://smart-queue-demo.vercel.app/presentation/index.html";

const stripCode = (md) => md.replace(/^\s*```[\s\S]*?^\s*```/gm, "").replace(/`[^`\n]*`/g, "");

export function headings(md) {
  return [...md.matchAll(/^## +(.+?)\s*$/gm)].map((m) => m[1]);
}

export function section(md, heading) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,2} /.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
}

// Abbreviations whose period does not end a sentence.
const ABBREVIATIONS = /\b(?:e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|Prof|St|No|approx)\./gi;

export function countSentences(text) {
  const plain = text
    .replace(/[*_`]/g, "")
    .replace(ABBREVIATIONS, (m) => m.replace(/\./g, ""))
    .replace(/(\d)\.(\d)/g, "$1$2")
    .trim();
  if (!plain) return 0;
  return plain.split(/[.!?]+(?:["')\]]*)(?=\s|$)/).filter((part) => part.trim()).length;
}

export function relativeLinks(md) {
  const links = [];
  for (const m of stripCode(md).matchAll(/\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const target = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//")) continue; // http(s), mailto, …
    const path = decodeURIComponent(target.replace(/[#?].*$/, ""));
    if (path) links.push(path); // "#anchor" alone points into the same file
  }
  return links;
}

export function brokenLinks(mdPath) {
  const base = dirname(mdPath);
  return relativeLinks(readFileSync(mdPath, "utf8")).filter((link) => !existsSync(resolve(base, link)));
}

export function featureRows(md) {
  const body = section(md, "Feature status") ?? "";
  return body
    .split(/\r?\n/)
    .filter((line) => /^\|/.test(line) && !/^\|\s*-/.test(line))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells[0] !== "Feature")
    .map(([feature, status, evidence]) => ({
      feature,
      status,
      evidence,
      titles: [...(evidence ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    }));
}

const unescapeTitle = (title) => title.replace(/\\(.)/g, "$1");
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Test titles as written in source. Template literals keep `${…}` placeholders,
// which match any value when a cited title is compared against them. A method
// call such as `regex.test(…)` is not a test (the lookbehind rejects `.test(`).
export function testTitles(source) {
  const titles = [];
  const call = /(?<![\w$.])(?:test|it)(?:\.(?:only|skip|fixme|todo))?\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  for (const m of source.matchAll(call)) titles.push({ template: m[1] === "`", text: unescapeTitle(m[2]) });
  return titles;
}

export function titleMatches(cited, { template, text }) {
  if (!template || !text.includes("${")) return cited === text;
  const literals = text.split(/\$\{[^}]*\}/);
  if (literals.join("").trim().length < 8) return false; // too little fixed text to prove anything
  return new RegExp(`^${literals.map(escapeRegex).join(".+?")}$`).test(cited);
}

function repoTestTitles() {
  const files = [
    ...readdirSync(join(repo, "frontend/e2e"))
      .filter((f) => f.endsWith(".spec.ts"))
      .map((f) => `frontend/e2e/${f}`),
    ...readdirSync(join(repo, "frontend/tests"))
      .filter((f) => f.endsWith(".test.mjs") && f !== "submission.test.mjs")
      .map((f) => `frontend/tests/${f}`),
  ];
  return files.flatMap((f) => testTitles(read(f)));
}

export function requirementNames(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)
    .map((line) => line.split(/[\s[<>=!~;]/)[0]);
}

const normalizePip = (name) => name.toLowerCase().replace(/[-_.]+/g, "-");

export function uncredited(names, creditText, normalize = (n) => n) {
  const credited = new Set([...creditText.matchAll(/`([^`]+)`/g)].map((m) => normalize(m[1])));
  return names.filter((name) => !credited.has(normalize(name)));
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/;

export function personalData(md) {
  const found = [];
  const email = md.match(EMAIL);
  if (email) found.push(`email: ${email[0]}`);
  const phone = md.match(PHONE);
  if (phone) found.push(`phone: ${phone[0]}`);
  return found;
}

// ---- helper edge cases ----

test("sentence count ignores abbreviations, decimals and markdown emphasis", () => {
  assert.equal(countSentences("One. Two! Three?"), 3);
  assert.equal(countSentences("Offices, e.g. clinics, lose slots. Dr. Rivera agrees."), 2);
  assert.equal(countSentences("About 15.6% were cancelled (i.e. refillable). **Done.**"), 2);
  assert.equal(countSentences("Ends with a quote \"here.\" Next one."), 2);
  assert.equal(countSentences(""), 0);
});

test("relative links drop anchors and queries and skip absolute or same-page links", () => {
  const md = [
    "[a](docs/A.md#section) [b](https://example.org/x.md) [c](#top)",
    "[d](mailto:someone) [e](../README.md?plain=1) [f](<my%20file.md>)",
    "`[not](a-link.md)`",
    "```",
    "[fenced](ignored.md)",
    "```",
  ].join("\n");
  assert.deepEqual(relativeLinks(md), ["docs/A.md", "../README.md", "my file.md"]);
});

test("cited titles match literal titles exactly and template titles by placeholder", () => {
  const template = `by $${"{lang}"} only`; // the source text `by ${lang} only`
  const source = [
    'test("plain title", f);',
    `test(\`${template}\`, f);`,
    "it('quoted \\'x\\' one', f);",
    'test.describe("group", f)',
    `/x/.test(\`${template}\`); expect(re.test("method call"))`,
  ].join(" ");
  const titles = testTitles(source);
  assert.deepEqual(
    titles.map((t) => t.text),
    ["plain title", template, "quoted 'x' one"],
  );
  assert.ok(titles.some((t) => titleMatches("plain title", t)));
  assert.ok(!titles.some((t) => titleMatches("plain titl", t)));
  assert.ok(titles.some((t) => titleMatches("by en only", t)));
  assert.ok(!titles.some((t) => titleMatches("by en only, extra", t)));
  const placeholdersOnly = { template: true, text: `$${"{a}"} $${"{b}"}` };
  assert.ok(!titleMatches("any cited title at all", placeholdersOnly));
  assert.ok(!titles.some((t) => titleMatches("group", t)));
});

test("requirement names drop extras, pins, markers and comments", () => {
  assert.deepEqual(
    requirementNames("# c\nuvicorn[standard]==0.30.0\npydantic-core==2.41.5 # x\nfoo>=1; python_version<'4'\n"),
    ["uvicorn", "pydantic-core", "foo"],
  );
  assert.deepEqual(uncredited(["pydantic_core", "httpx"], "`pydantic-core`", normalizePip), ["httpx"]);
});

test("personal-data scan flags emails and phone numbers but not dates or versions", () => {
  assert.equal(personalData("Contact name@example.org").length, 1);
  assert.equal(personalData("Call (787) 555-0123").length, 1);
  assert.equal(personalData("Call 787-555-0123").length, 1);
  assert.deepEqual(personalData("2026-10-08 20:32, Node 25.9.0, `@axe-core/playwright`, 90%"), []);
});

// ---- the real documents ----

const SUBMISSION = "docs/SUBMISSION.md";

test("SUBMISSION.md has every required section, a team banner and the presentation links", () => {
  const md = read(SUBMISSION);
  const present = headings(md);
  for (const heading of REQUIRED_SECTIONS) assert.ok(present.includes(heading), `missing section: ${heading}`);
  assert.match(section(md, "Team"), /confirm before submitting/i);
  assert.ok(md.includes(PRESENTATION_URL), "live presentation URL missing");
  assert.ok(md.includes("Press for presentation"), "in-app presentation link not mentioned");
  assert.match(read("frontend/src/App.tsx"), /t\("Press for presentation"\)/, "in-app link label changed");
  const steps = section(md, "How to review").match(/^\d+\. /gm) ?? [];
  assert.ok(steps.length >= 1 && steps.length <= 5, `review steps: ${steps.length}`);
});

test("SUBMISSION.md description is 2–3 sentences", () => {
  const sentences = countSentences(section(read(SUBMISSION), "Description"));
  assert.ok(sentences >= 2 && sentences <= 3, `description has ${sentences} sentences`);
});

test("every relative link in SUBMISSION.md and README.md resolves to a file", () => {
  for (const doc of [SUBMISSION, "README.md"]) {
    assert.deepEqual(brokenLinks(join(repo, doc)), [], `broken links in ${doc}`);
  }
});

test("feature table uses only Working/Simulated/Planned and cites existing test titles", () => {
  const rows = featureRows(read(SUBMISSION));
  assert.ok(rows.length > 0, "feature table is empty");
  for (const status of STATUSES) assert.ok(rows.some((r) => r.status === status), `no ${status} row`);
  const titles = repoTestTitles();
  for (const row of rows) {
    assert.ok(STATUSES.includes(row.status), `bad status "${row.status}" for ${row.feature}`);
    if (row.status === "Planned") continue;
    assert.ok(row.titles.length > 0, `${row.feature}: no test title cited`);
    for (const cited of row.titles) {
      assert.ok(titles.some((t) => titleMatches(cited, t)), `${row.feature}: no test titled "${cited}"`);
    }
  }
});

test("every frontend and backend package is credited in the README", () => {
  const credits = section(read("README.md"), "Pre-existing components");
  assert.ok(credits, "README has no Pre-existing components section");
  const pkg = JSON.parse(read("frontend/package.json"));
  const npmNames = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  assert.deepEqual(uncredited(npmNames, credits), [], "npm packages not credited");
  const pipNames = requirementNames(read("backend/requirements.txt"));
  assert.ok(pipNames.length > 0);
  assert.deepEqual(uncredited(pipNames, credits, normalizePip), [], "Python packages not credited");
});

test("SUBMISSION.md and the README contain no email addresses or phone numbers", () => {
  assert.deepEqual(personalData(read(SUBMISSION)), []);
  assert.deepEqual(personalData(read("README.md")), []);
});

test("README links to the submission page", () => {
  assert.match(read("README.md"), /\]\(docs\/SUBMISSION\.md\)/);
});
