import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { packageVercel, verifyVercel } from '../scripts/package-vercel.mjs';
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'queue-package-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'dist');
  const stage = join(root, 'stage');
  await mkdir(join(source, 'assets'), { recursive: true });
  const policy = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'";
  await writeFile(join(source, 'index.html'), `<meta http-equiv="Content-Security-Policy" content="${policy}"><script src="/assets/index-demo.js"></script><link href="/assets/index-demo.css">`);
  await writeFile(join(source, 'assets/index-demo.js'), 'console.log("demo")');
  await writeFile(join(source, 'assets/index-demo.css'), 'body{color:navy}');
  return {source, stage};
}
test('packages static output, independently verifies it, refuses overwrites', async t => {
  const {source, stage} = await fixture(t);
  assert.equal((await packageVercel(source, stage)).length, 3);
  assert.equal((await verifyVercel(stage)).length, 3);
  await assert.rejects(packageVercel(source, stage), /EEXIST/);
});
test('refuses unsafe source before packaging', async t => {
  const {source, stage} = await fixture(t);
  await writeFile(join(source, '.env.production'), 'synthetic test');
  await assert.rejects(packageVercel(source, stage), /Unexpected artifact/);
});
for (const path of ['.env', '.vercel/project.json', '.vercel/output/functions', '.vercel/output/static/patients.db']) {
  test(`rejects extra upload content: ${path}`, async t => {
    const {source, stage} = await fixture(t);
    await packageVercel(source, stage);
    await writeFile(join(stage, path), 'synthetic test');
    await assert.rejects(verifyVercel(stage), /Unexpected/);
  });
}
test('rejects altered and symlinked output configuration', async t => {
  const {source, stage} = await fixture(t);
  await packageVercel(source, stage);
  const config = join(stage, '.vercel/output/config.json');
  await writeFile(config, '{"version":3,"routes":[]}');
  await assert.rejects(verifyVercel(stage), /Unexpected output config/);
  await rm(config);
  await symlink(join(source, 'index.html'), config);
  await assert.rejects(verifyVercel(stage), /Invalid output config/);
});
