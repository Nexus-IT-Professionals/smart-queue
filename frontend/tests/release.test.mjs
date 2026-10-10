import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { verifyDemo } from "../scripts/verify-demo.mjs";
import { symlinkSkipReason } from "./symlink-support.mjs";
import {
  deckHtml,
  policy,
  presentationFiles,
  writePresentation,
} from "./presentation-fixture.mjs";
const html = `<html><head><meta http-equiv="Content-Security-Policy" content="${policy}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script type="module" src="/assets/index-abc123.js"></script><link rel="stylesheet" href="/assets/index-abc123.css"></head></html>`;
const shipped = 3 + presentationFiles.length;
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "queue-release-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, "assets"));
  await writeFile(join(dir, "index.html"), html);
  await writeFile(
    join(dir, "assets/index-abc123.js"),
    'console.log("Synthetic demo");',
  );
  await writeFile(
    join(dir, "assets/index-abc123.css"),
    "body { color: navy; }",
  );
  await writePresentation(dir);
  return dir;
}
for (const encoded of [false, true]) {
  test(`accepts local UI assets with encoded CSP: ${encoded}`, async (t) => {
    const dir = await fixture(t);
    if (encoded)
      await writeFile(join(dir, "index.html"), html.replaceAll("'", "&#39;"));
    assert.equal((await verifyDemo(dir)).length, shipped);
  });
}
test("accepts exactly the favicon and presentation runtime files", async (t) => {
  const dir = await fixture(t);
  const files = await verifyDemo(dir);
  for (const file of presentationFiles) assert.ok(files.includes(file), file);
});
for (const name of [
  ".env",
  "patients.db",
  "assets/index-abc123.js.map",
  "backup.zip",
  "favicon.ico",
  "favicon.png",
  "presentation/PRESENTATION_PLAN.md",
  "presentation/README.md",
  "presentation/SPEAKER_NOTES.md",
  "presentation/favicon.svg",
  "presentation/script.js.map",
  "presentation/capture.mjs",
  "presentation/index.htm",
  "presentation/assets/characters/cast.jpg",
  "presentation/assets/screenshots/open-slot.png.map",
  "presentation/assets/screenshots/a.b.png",
  "presentation/assets/cast.png",
  "presentation/video/other.pdf",
]) {
  test(`rejects unexpected release file ${name}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, name), "fixture");
    await assert.rejects(verifyDemo(dir), /Unexpected artifact/);
  });
}
for (const name of [
  "presentation/tests/validate.mjs",
  "presentation/assets/images/cast.png",
  "docs/presentation/index.html",
]) {
  test(`rejects unexpected release directory for ${name}`, async (t) => {
    const dir = await fixture(t);
    await mkdir(dirname(join(dir, name)), { recursive: true });
    await writeFile(join(dir, name), "fixture");
    await assert.rejects(verifyDemo(dir), /Unexpected directory/);
  });
}
test("rejects symlinks even with an allowed asset filename", async (t) => {
  const skip = await symlinkSkipReason();
  if (skip) return t.skip(skip);
  const dir = await fixture(t);
  await symlink(join(dir, "index.html"), join(dir, "assets/linked-abc123.js"));
  await assert.rejects(verifyDemo(dir), /Symlink forbidden/);
});
test("rejects symlinks in the presentation", async (t) => {
  const skip = await symlinkSkipReason();
  if (skip) return t.skip(skip);
  const dir = await fixture(t);
  await symlink(
    join(dir, "index.html"),
    join(dir, "presentation/assets/screenshots/linked.png"),
  );
  await assert.rejects(verifyDemo(dir), /Symlink forbidden/);
});
for (const [label, content] of [
  ["missing CSP", html.replace(/<meta[^>]+>/, "")],
  ["weakened CSP", html.replace("connect-src 'none'", "connect-src *")],
  [
    "remote script",
    html.replace("/assets/index-abc123.js", "https://example.com/app.js"),
  ],
  ["unshipped root icon", html.replace("/favicon.svg", "/favicon.ico")],
]) {
  test(`rejects ${label}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, "index.html"), content);
    await assert.rejects(verifyDemo(dir), /CSP|local assets/);
  });
}
for (const [label, content] of [
  ["missing presentation CSP", deckHtml.replace(/<meta http-equiv[^>]+>/, "")],
  [
    "weakened presentation CSP",
    deckHtml.replace("connect-src 'none'", "connect-src *"),
  ],
  [
    "presentation CSP after its script",
    deckHtml.replace(
      /(<meta http-equiv[^>]+>)(.*)(<\/head>)/,
      "$2$1$3",
    ),
  ],
  [
    "a second, looser presentation CSP",
    deckHtml.replace(
      "<head>",
      '<head><meta http-equiv="Content-Security-Policy" content="default-src *">',
    ),
  ],
  ["presentation without its script", deckHtml.replace(/<script[^>]+><\/script>/, "")],
]) {
  test(`rejects ${label}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, "presentation/index.html"), content);
    await assert.rejects(verifyDemo(dir), /presentation CSP/);
  });
}
for (const [label, file, content] of [
  [
    "remote presentation script",
    "presentation/index.html",
    deckHtml.replace('src="script.js"', 'src="https://example.com/x.js"'),
  ],
  [
    "presentation reference outside its folder",
    "presentation/index.html",
    deckHtml.replace('href="styles.css"', 'href="../assets/index-abc123.css"'),
  ],
  [
    "unshipped presentation image",
    "presentation/index.html",
    deckHtml.replace("open-slot.png", "missing.png"),
  ],
  [
    "remote presentation stylesheet image",
    "presentation/styles.css",
    "body { background: url(https://example.com/x.png); }",
  ],
]) {
  test(`rejects ${label}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, file), content);
    await assert.rejects(verifyDemo(dir), /shipped beside it/);
  });
}
for (const file of [
  "presentation/index.html",
  "presentation/script.js",
  "presentation/styles.css",
  "presentation/video/smart-queue-demo-2min.pdf",
]) {
  test(`rejects a release without ${file}`, async (t) => {
    const dir = await fixture(t);
    await rm(join(dir, file));
    await assert.rejects(verifyDemo(dir), /Missing presentation/);
  });
}
test("rejects a referenced favicon that was not shipped", async (t) => {
  const dir = await fixture(t);
  await rm(join(dir, "favicon.svg"));
  await assert.rejects(verifyDemo(dir), /local assets/);
});
for (const content of [
  'fetch("/api/health")',
  "//# sourceMappingURL=index.js.map",
  "-----BEGIN PRIVATE KEY-----",
]) {
  test(`rejects forbidden bundle content: ${content}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, "assets/index-abc123.js"), content);
    await assert.rejects(verifyDemo(dir), /Forbidden release content/);
  });
  test(`rejects forbidden presentation content: ${content}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, "presentation/script.js"), content);
    await assert.rejects(verifyDemo(dir), /Forbidden release content/);
  });
}
