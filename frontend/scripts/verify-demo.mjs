import { lstat, readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

// A narrow release guard, not a general secret or patient-data detector.
const DIRECTORIES = new Set([
  "assets",
  "presentation",
  "presentation/assets",
  "presentation/assets/characters",
  "presentation/assets/screenshots",
]);
// The app shell, its favicon, and the exact runtime files of the offline presentation
// (scripts/copy-presentation.mjs); no notes, tests, maps, or other types.
const ARTIFACT =
  /^(index\.html|favicon\.svg|assets\/[\w-]+-[\w-]+\.(js|css)|presentation\/(index\.html|script\.js|styles\.css|assets\/(characters|screenshots)\/[\w-]+\.(?:png|webp)))$/;
const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'";
// Exactly one CSP meta, with the public-demo policy, ahead of any script.
function hasPolicyBeforeScripts(html) {
  const policy = html.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/?\s*>/i,
  );
  const policies = html.match(/http-equiv="Content-Security-Policy"/gi) ?? [];
  const firstScript = html.search(/<script\b/i);
  return (
    !!policy &&
    policies.length === 1 &&
    policy[1].replaceAll("&#39;", "'") === CSP &&
    (firstScript === -1 || html.indexOf(policy[0]) < firstScript)
  );
}
export async function verifyDemo(directory) {
  const files = [];
  async function visit(relative = "") {
    const path = join(directory, relative);
    const stat = await lstat(path);
    if (stat.isSymbolicLink())
      throw new Error(`Symlink forbidden: ${relative || "."}`);
    if (stat.isDirectory()) {
      if (relative && !DIRECTORIES.has(relative))
        throw new Error(`Unexpected directory: ${relative}`);
      for (const name of await readdir(path))
        await visit(relative ? `${relative}/${name}` : name);
      return;
    }
    if (!stat.isFile() || !ARTIFACT.test(relative)) {
      throw new Error(`Unexpected artifact: ${relative}`);
    }
    const content = await readFile(path, "utf8");
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}|sourceMappingURL\s*=|\/api\//.test(
        content,
      )
    ) {
      throw new Error(`Forbidden release content in ${relative}`);
    }
    files.push(relative);
  }
  await visit();
  if (
    !files.includes("index.html") ||
    !files.some((f) => f.endsWith(".js")) ||
    !files.some((f) => f.endsWith(".css"))
  ) {
    throw new Error("Missing HTML, JavaScript, or CSS entry assets");
  }
  const html = await readFile(join(directory, "index.html"), "utf8");
  if (!hasPolicyBeforeScripts(html)) {
    throw new Error("Missing or altered public-demo CSP before scripts");
  }
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (
      !(match[1].startsWith("/assets/") || match[1] === "/favicon.svg") ||
      !files.includes(match[1].slice(1))
    ) {
      throw new Error(
        "HTML must reference only emitted local assets at the site root",
      );
    }
  }
  // The sidebar links to presentation/index.html, so it must ship complete,
  // under the same CSP, and reference only files shipped beside it.
  for (const required of ["index.html", "script.js", "styles.css"])
    if (!files.includes(`presentation/${required}`))
      throw new Error(`Missing presentation/${required}`);
  const deck = await readFile(
    join(directory, "presentation/index.html"),
    "utf8",
  );
  if (!hasPolicyBeforeScripts(deck) || deck.search(/<script\b/i) === -1)
    throw new Error("Missing or altered presentation CSP before scripts");
  const styles = await readFile(
    join(directory, "presentation/styles.css"),
    "utf8",
  );
  for (const ref of [
    ...[...deck.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...styles.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map(
      (m) => m[1],
    ),
  ]) {
    // Besides its own files, only the site favicon one level up.
    const target = ref === "../favicon.svg" ? "favicon.svg" : `presentation/${ref}`;
    if (!files.includes(target))
      throw new Error(
        `Presentation must reference only files shipped beside it: ${ref}`,
      );
  }
  return files.sort();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const files = await verifyDemo(resolve(process.argv[2] || "dist"));
    console.log(
      `Public demo verified: ${files.length} files; API connections blocked by CSP.`,
    );
    console.log(files.join("\n"));
  } catch (error) {
    console.error(`Public demo verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
