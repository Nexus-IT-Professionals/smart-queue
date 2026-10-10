import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// A minimal shipped presentation + favicon, shaped like copy-presentation.mjs
// output, for release-guard and packaging fixtures.
export const policy =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'";
export const deckHtml = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><script src="script.js" defer></script></head><body><img src="assets/characters/cast.png" alt=""><img src="assets/screenshots/open-slot.png" alt=""></body></html>`;
export const presentationFiles = [
  "favicon.svg",
  "presentation/index.html",
  "presentation/script.js",
  "presentation/styles.css",
  "presentation/assets/characters/cast.png",
  "presentation/assets/screenshots/open-slot.png",
  "presentation/video/smart-queue-demo-2min.pdf",
];
export async function writePresentation(dir) {
  await mkdir(join(dir, "presentation/assets/characters"), { recursive: true });
  await mkdir(join(dir, "presentation/assets/screenshots"), { recursive: true });
  await mkdir(join(dir, "presentation/video"), { recursive: true });
  await writeFile(join(dir, "favicon.svg"), "<svg></svg>");
  await writeFile(join(dir, "presentation/index.html"), deckHtml);
  await writeFile(join(dir, "presentation/script.js"), 'console.log("deck");');
  await writeFile(
    join(dir, "presentation/styles.css"),
    '.cast { background-image: url("assets/characters/cast.png"); }',
  );
  for (const png of presentationFiles.filter((f) => f.endsWith(".png")))
    await writeFile(join(dir, png), "PNG fixture");
  await writeFile(
    join(dir, "presentation/video/smart-queue-demo-2min.pdf"),
    "%PDF-1.3\nfixture",
  );
}
