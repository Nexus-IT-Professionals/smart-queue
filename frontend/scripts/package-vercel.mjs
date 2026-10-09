import { cp, lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyDemo } from './verify-demo.mjs';

export async function verifyVercel(stage) {
  // Strict tree: no functions, env files, link metadata, or additional config.
  for (const [path, expected] of [
    [stage, ['.vercel']],
    [join(stage, '.vercel'), ['output']],
    [join(stage, '.vercel/output'), ['config.json', 'static']],
  ]) {
    if (!(await lstat(path)).isDirectory() || (await lstat(path)).isSymbolicLink()) throw new Error('Invalid staging directory');
    if (JSON.stringify((await readdir(path)).sort()) !== JSON.stringify(expected)) throw new Error('Unexpected staging content');
  }
  const config = join(stage, '.vercel/output/config.json');
  if (!(await lstat(config)).isFile() || (await lstat(config)).isSymbolicLink()) throw new Error('Invalid output config');
  if ((await readFile(config, 'utf8')) !== '{"version":3}\n') throw new Error('Unexpected output config');
  return verifyDemo(join(stage, '.vercel/output/static'));
}

export async function packageVercel(source, stage) {
  await verifyDemo(source);
  // Never clean an arbitrary caller-supplied directory. Existing output fails closed.
  await mkdir(stage);
  await mkdir(join(stage, '.vercel/output'), { recursive: true });
  await cp(source, join(stage, '.vercel/output/static'), { recursive: true, dereference: false });
  await writeFile(join(stage, '.vercel/output/config.json'), '{"version":3}\n');
  return verifyVercel(stage);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const checking = process.argv[2] === '--verify';
    const files = checking
      ? await verifyVercel(resolve(process.argv[3] || '.vercel-stage'))
      : await packageVercel(resolve('dist'), resolve(process.argv[2] || '.vercel-stage'));
    console.log(`Vercel static package verified: ${files.length} UI files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
