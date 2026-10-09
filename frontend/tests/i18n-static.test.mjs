import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spanish } from "../src/i18n/catalog.ts";

// Static guard against user-visible English that bypasses the catalog. This is
// a regex heuristic, not a parser: it covers the patterns this codebase uses
// (JSX text, string-literal a11y attributes, {"..."} children, t("...") keys).
// Text built from data/props passed through t() is covered at runtime by
// e2e/language.spec.ts ("no untranslated text"), which scans the live DOM.
const src = fileURLToPath(new URL("../src", import.meta.url));
const files = readdirSync(src, { recursive: true })
  .filter((file) => file.endsWith(".tsx"))
  .map((file) => ({
    file: file.replaceAll("\\", "/"),
    code: readFileSync(join(src, file), "utf8")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, ""),
  }));
// Every entry is intentionally not translated:
const allowed = new Set([
  "App.tsx: English", // Language switch: each language names itself (lang="en").
  "App.tsx: Español", // Language switch: each language names itself (lang="es").
  "App.tsx: Language / Idioma", // Bilingual label of the language switch.
  "App.tsx: smart", // Brand wordmark "smartqueue".
  "App.tsx: queue", // Brand wordmark "smartqueue".
  "App.tsx: SQ", // aria-hidden brand avatar initials.
  "App.tsx: Smart Queue · Caribbean AI 2026 Hackathon", // Product + event names.
  "pages/patient/PatientWorkspace.tsx: Elena Morales", // Fictional person name.
]);
const used = new Set();
function findings(pattern) {
  const found = [];
  for (const { file, code } of files)
    for (const match of code.matchAll(pattern)) {
      const text = match
        .slice(1)
        .find((group) => group !== undefined)
        .replace(/\s+/g, " ")
        .trim();
      const entry = `${file}: ${text}`;
      if (allowed.has(entry)) used.add(entry);
      else if (/[A-Za-zÀ-ÿ]/.test(text)) found.push(entry);
    }
  return found;
}
test("JSX contains no hard-coded user-visible text outside the catalog", () => {
  // Text between a tag end (not the => arrow, not followed by the comma of an
  // object/array of JSX values) or an expression end and the next tag or
  // expression, excluding code-looking runs.
  const jsxText =
    /(?<!=)>(?!\s*,)([^<>{}();=]+?)(?=[<{])|\}([^<>{}();=`$]+?)(?=<)/g;
  assert.deepEqual(findings(jsxText), []);
});
test("a11y attributes and string children are not hard-coded literals", () => {
  assert.deepEqual(
    findings(
      /\b(?:aria-label|aria-description|title|placeholder|alt)=(?:"([^"]*)"|\{\s*["'`]([^"'`]*)["'`]\s*\})/g,
    ).concat(findings(/>\s*\{\s*["'`]([^"'`]*)["'`]\s*\}/g)),
    [],
  );
});
test("every literal t() key exists in the Spanish catalog", () => {
  const keys = files.flatMap(({ file, code }) =>
    [...code.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"\s*,?\s*\)/g)].map(
      (match) => [file, JSON.parse(`"${match[1]}"`)],
    ),
  );
  assert.ok(keys.length > 100, `only ${keys.length} t() keys found`);
  assert.deepEqual(
    keys.filter(([, key]) => !(key in spanish)).map((pair) => pair.join(": ")),
    [],
  );
});
// Runs last (node:test keeps file order): a stale allowlist entry means the
// scan no longer reaches that text, so the allowlist must shrink with the code.
test("every static allowlist entry is still matched", () => {
  assert.deepEqual(
    [...allowed].filter((entry) => !used.has(entry)),
    [],
  );
});
