import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  copyPresentation,
  presentationIndexHtml,
  presentationDevMiddleware,
} from "../scripts/copy-presentation.mjs";
import { verifyDemo } from "../scripts/verify-demo.mjs";
import { policy } from "./presentation-fixture.mjs";

const app = `<html><head><meta http-equiv="Content-Security-Policy" content="${policy}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script type="module" src="/assets/index-abc123.js"></script><link rel="stylesheet" href="/assets/index-abc123.css"></head></html>`;
async function dist(t) {
  const dir = await mkdtemp(join(tmpdir(), "queue-deck-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, "assets"));
  await writeFile(join(dir, "index.html"), app);
  await writeFile(join(dir, "favicon.svg"), "<svg></svg>");
  await writeFile(join(dir, "assets/index-abc123.js"), "console.log(1)");
  await writeFile(join(dir, "assets/index-abc123.css"), "body{}");
  return dir;
}
async function walk(dir, prefix = "") {
  const out = [];
  for (const entry of await readdir(join(dir, prefix), { withFileTypes: true }))
    if (entry.isDirectory())
      out.push(...(await walk(dir, `${prefix}${entry.name}/`)));
    else out.push(`${prefix}${entry.name}`);
  return out;
}

test("copies only the presentation runtime files and passes the release guard", async (t) => {
  const dir = await dist(t);
  const copied = await copyPresentation(dir);
  assert.deepEqual(copied.slice(0, 3), [
    "presentation/index.html",
    "presentation/script.js",
    "presentation/styles.css",
  ]);
  const shipped = (await walk(dir, "presentation/")).sort();
  assert.deepEqual(shipped, [...copied].sort());
  assert.ok(shipped.includes("presentation/assets/characters/cast.webp"));
  assert.ok(!shipped.some((f) => /\.(md|mjs)$|tests\/|\.gitkeep/.test(f)));
  const files = await verifyDemo(dir);
  assert.equal(files.length, 4 + copied.length);
  // Re-running replaces the previous copy rather than accumulating files.
  await writeFile(join(dir, "presentation/stale.md"), "old");
  await copyPresentation(dir);
  assert.equal((await verifyDemo(dir)).length, 4 + copied.length);
});

test("built presentation carries exactly one public-demo CSP, first in head", async (t) => {
  const dir = await dist(t);
  await copyPresentation(dir);
  const html = await readFile(join(dir, "presentation/index.html"), "utf8");
  assert.equal(html.match(/Content-Security-Policy/g).length, 1);
  assert.ok(html.includes(`content="${policy}"`));
  assert.ok(html.indexOf(policy) < html.indexOf("<script"));
  assert.ok(html.indexOf(policy) < html.indexOf("<link rel=\"stylesheet\""));
  assert.ok(html.includes('<link rel="icon" href="../favicon.svg"'));
});

test("CSP injection replaces a looser source policy and keeps charset first", () => {
  const out = presentationIndexHtml(
    '<html><head>\n<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="default-src *"><script src="script.js"></script></head></html>',
  );
  assert.ok(!out.includes("default-src *"));
  assert.match(out, /^<html><head>\n<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy"/);
  assert.throws(() => presentationIndexHtml("<html></html>"), /no <head>/);
});

test("copies PNG and WebP while skipping unrelated image-folder files", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "queue-deck-src-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, "presentation");
  for (const sub of ["assets/characters", "assets/screenshots", "video"])
    await mkdir(join(source, sub), { recursive: true });
  await writeFile(join(source, "index.html"), "<html><head></head></html>");
  await writeFile(join(source, "script.js"), "");
  await writeFile(join(source, "styles.css"), "");
  await writeFile(join(source, "README.md"), "notes");
  await writeFile(join(source, "assets/characters/cast.png"), "png");
  await writeFile(join(source, "assets/characters/cast.webp"), "webp");
  await writeFile(join(source, "assets/characters/.gitkeep"), "");
  await writeFile(join(source, "assets/screenshots/notes.txt"), "x");
  await writeFile(join(source, "video/smart-queue-demo-2min.pdf"), "%PDF-1.3\nfixture");
  const out = join(root, "dist");
  assert.deepEqual(await copyPresentation(out, source), [
    "presentation/index.html",
    "presentation/script.js",
    "presentation/styles.css",
    "presentation/assets/characters/cast.png",
    "presentation/assets/characters/cast.webp",
    "presentation/video/smart-queue-demo-2min.pdf",
  ]);
});

test("development presentation route serves the PDF with its media type", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "queue-deck-dev-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "video"), { recursive: true });
  await writeFile(join(root, "video/smart-queue-demo-2min.pdf"), "%PDF-1.3\nfixture");
  const middleware = presentationDevMiddleware(root);
  const headers = {};
  let body;
  let nextCalled = false;
  await middleware(
    { url: "/video/smart-queue-demo-2min.pdf" },
    {
      setHeader: (key, value) => { headers[key] = value; },
      end: (content) => { body = content; },
    },
    () => { nextCalled = true; },
  );
  assert.equal(headers["Content-Type"], "application/pdf");
  assert.equal(body.toString("utf8", 0, 5), "%PDF-");
  assert.equal(nextCalled, false);
});
