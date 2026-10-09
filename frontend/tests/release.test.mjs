import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyDemo } from "../scripts/verify-demo.mjs";
import { symlinkSkipReason } from "./symlink-support.mjs";
const policy =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'";
const html = `<html><head><meta http-equiv="Content-Security-Policy" content="${policy}"><script type="module" src="/assets/index-abc123.js"></script><link rel="stylesheet" href="/assets/index-abc123.css"></head></html>`;
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
  return dir;
}
for (const encoded of [false, true]) {
  test(`accepts local UI assets with encoded CSP: ${encoded}`, async (t) => {
    const dir = await fixture(t);
    if (encoded)
      await writeFile(join(dir, "index.html"), html.replaceAll("'", "&#39;"));
    assert.equal((await verifyDemo(dir)).length, 3);
  });
}
for (const name of [
  ".env",
  "patients.db",
  "assets/index-abc123.js.map",
  "backup.zip",
]) {
  test(`rejects unexpected release file ${name}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, name), "fixture");
    await assert.rejects(verifyDemo(dir), /Unexpected artifact/);
  });
}
test("rejects symlinks even with an allowed asset filename", async (t) => {
  const skip = await symlinkSkipReason();
  if (skip) return t.skip(skip);
  const dir = await fixture(t);
  await symlink(join(dir, "index.html"), join(dir, "assets/linked-abc123.js"));
  await assert.rejects(verifyDemo(dir), /Symlink forbidden/);
});
for (const [label, content] of [
  ["missing CSP", html.replace(/<meta[^>]+>/, "")],
  ["weakened CSP", html.replace("connect-src 'none'", "connect-src *")],
  [
    "remote script",
    html.replace("/assets/index-abc123.js", "https://example.com/app.js"),
  ],
]) {
  test(`rejects ${label}`, async (t) => {
    const dir = await fixture(t);
    await writeFile(join(dir, "index.html"), content);
    await assert.rejects(verifyDemo(dir), /CSP|local assets/);
  });
}
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
}
