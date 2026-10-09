import { copyFile, lstat, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Ships the offline presentation (repo-root presentation/, owned separately)
// into the build output under presentation/. Only the runtime files are
// copied: never the plan/notes .md files, tests/, or anything else. The copied
// index.html gets the same CSP as the public demo; verify-demo.mjs checks it.
export const PRESENTATION_CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'";
const defaultSource = fileURLToPath(new URL("../../presentation", import.meta.url));
const ROOT_FILES = ["index.html", "script.js", "styles.css"];
const IMAGE_DIRS = ["assets/characters", "assets/screenshots"];

async function regularFile(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isFile())
    throw new Error(`Presentation source is not a regular file: ${path}`);
}

export function presentationIndexHtml(html) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${PRESENTATION_CSP}">`;
  const existing = /<meta\s+http-equiv="Content-Security-Policy"[^>]*>/gi;
  const stripped = html.replace(existing, "");
  // At the top of <head> (after the charset declaration, if it leads) so the
  // policy precedes every script and stylesheet.
  const anchor = /<head[^>]*>(\s*<meta\s+charset=[^>]*>)?/i;
  if (!anchor.test(stripped))
    throw new Error("Presentation index.html has no <head>");
  // The site favicon (frontend/public) sits one level up in every build, and
  // linking it stops the browser's implicit /favicon.ico request (a 404).
  const icon = '<link rel="icon" href="../favicon.svg" type="image/svg+xml">';
  return stripped.replace(anchor, (start) => `${start}\n${meta}\n${icon}`);
}

export async function copyPresentation(outDir, source = defaultSource) {
  const target = join(outDir, "presentation");
  await rm(target, { recursive: true, force: true });
  const files = [];
  for (const name of ROOT_FILES) {
    await regularFile(join(source, name));
    files.push(name);
  }
  for (const dir of IMAGE_DIRS)
    for (const name of (await readdir(join(source, dir))).sort()) {
      if (!/^[\w-]+\.png$/.test(name)) continue; // e.g. .gitkeep
      await regularFile(join(source, dir, name));
      files.push(`${dir}/${name}`);
    }
  for (const file of files) {
    await mkdir(dirname(join(target, file)), { recursive: true });
    if (file === "index.html")
      await writeFile(
        join(target, file),
        presentationIndexHtml(await readFile(join(source, file), "utf8")),
      );
    else await copyFile(join(source, file), join(target, file));
  }
  return files.map((file) => `presentation/${file}`);
}

// `vite dev` serves the same allowlisted files straight from the source folder
// (with the same CSP), so the sidebar link works without a build. `vite
// preview` serves dist/, which already holds the copied presentation.
const DEV_FILE =
  /^(index\.html|script\.js|styles\.css|assets\/(characters|screenshots)\/[\w-]+\.png)$/;
const TYPES = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
};
export function presentationDevMiddleware(source = defaultSource) {
  return async (req, res, next) => {
    // Mounted at /presentation, so req.url is the remainder (e.g. /index.html).
    const path = (req.url ?? "/").split(/[?#]/)[0];
    if (path === "" || path === "/") {
      res.statusCode = 302;
      res.setHeader("Location", "/presentation/index.html");
      return res.end();
    }
    const file = path.slice(1);
    if (!DEV_FILE.test(file)) return next();
    try {
      await regularFile(join(source, file));
      const body =
        file === "index.html"
          ? presentationIndexHtml(await readFile(join(source, file), "utf8"))
          : await readFile(join(source, file));
      res.setHeader("Content-Type", TYPES[file.split(".").pop()]);
      res.end(body);
    } catch {
      next();
    }
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const files = await copyPresentation(resolve(process.argv[2] || "dist"));
    console.log(`Presentation copied: ${files.length} files.`);
  } catch (error) {
    console.error(`Presentation copy failed: ${error.message}`);
    process.exitCode = 1;
  }
}
