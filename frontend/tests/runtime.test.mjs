import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// DEP-2: guard against drift between the declared runtime versions
// (.nvmrc, package.json engines, CI workflow, Dockerfile, backend pins, lockfile).
const repo = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFile(repo + path, "utf8");

const EXACT = /^\d+\.\d+\.\d+$/;

export function parseNvmrc(text) {
  const value = text.trim();
  if (!EXACT.test(value))
    throw new Error(`.nvmrc must be an exact x.y.z version, got "${value}"`);
  return value;
}

function parsePartial(version) {
  if (!/^\d+(\.\d+){0,2}$/.test(version))
    throw new Error(`Unsupported version "${version}"`);
  const parts = version.split(".").map(Number);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

// Minimal range check: space-separated comparators (>=, >, <=, <, =, bare),
// all of which must hold. Anything fancier (||, ^, ~, x, -) is rejected.
export function satisfies(version, range) {
  const v = parsePartial(parseNvmrc(version));
  const comparators = range.trim().split(/\s+/).filter(Boolean);
  if (comparators.length === 0) throw new Error("Empty engines range");
  return comparators.every((comparator) => {
    const match = /^(>=|<=|>|<|=)?(\d+(?:\.\d+){0,2})$/.exec(comparator);
    if (!match) throw new Error(`Unsupported comparator "${comparator}"`);
    const c = compare(v, parsePartial(match[2]));
    switch (match[1] ?? "=") {
      case ">=":
        return c >= 0;
      case ">":
        return c > 0;
      case "<=":
        return c <= 0;
      case "<":
        return c < 0;
      default:
        return c === 0;
    }
  });
}

export function workflowNodeVersions(yaml) {
  const versions = [];
  for (const line of yaml.split(/\r?\n/)) {
    const match = /^\s*-?\s*node-version:\s*(.*)$/.exec(line);
    if (!match) continue;
    const value = match[1]
      .replace(/\s+#.*$/, "")
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
    versions.push(value);
  }
  return versions;
}

export function dockerImages(dockerfile) {
  const stages = new Set();
  const images = [];
  for (const line of dockerfile.split(/\r?\n/)) {
    const match = /^\s*FROM\s+(?:--\S+\s+)*(\S+)(?:\s+AS\s+(\S+))?\s*$/i.exec(
      line,
    );
    if (!match) continue;
    const [, image, stage] = match;
    if (!stages.has(image.toLowerCase())) images.push(image);
    if (stage) stages.add(stage.toLowerCase());
  }
  return images;
}

export function imageTag(image) {
  if (image.includes("@")) return image.slice(image.indexOf("@") + 1);
  const name = image.slice(image.lastIndexOf("/") + 1);
  return name.includes(":") ? name.slice(name.indexOf(":") + 1) : "";
}

export function isPinnedImage(image) {
  const tag = imageTag(image);
  return /^sha256:[0-9a-f]{64}$/.test(tag) || /^\d+\.\d+\.\d+(-|$)/.test(tag);
}

export function unpinnedRequirements(text) {
  const pinned =
    /^[A-Za-z0-9][A-Za-z0-9._-]*(\[[A-Za-z0-9._,-]+\])?==[A-Za-z0-9._+-]+$/;
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/(^|\s)#.*$/, "").trim())
    .filter((line) => line && !pinned.test(line.replace(/\s+/g, "")));
}

export function lockfileDrift(pkg, lock) {
  const problems = [];
  if (!(lock.lockfileVersion >= 3))
    problems.push(`lockfileVersion ${lock.lockfileVersion} < 3`);
  const root = lock.packages?.[""] ?? {};
  for (const field of ["dependencies", "devDependencies"]) {
    const a = JSON.stringify(Object.entries(pkg[field] ?? {}).sort());
    const b = JSON.stringify(Object.entries(root[field] ?? {}).sort());
    if (a !== b) problems.push(`${field} differ between package.json and lock`);
  }
  return problems;
}

// --- Repository checks ---------------------------------------------------

test("repository runtime versions agree", async () => {
  const nvmrc = parseNvmrc(await read("frontend/.nvmrc"));
  const pkg = JSON.parse(await read("frontend/package.json"));
  assert.ok(pkg.engines?.node, "package.json engines.node is missing");
  assert.ok(
    satisfies(nvmrc, pkg.engines.node),
    `.nvmrc ${nvmrc} outside engines ${pkg.engines.node}`,
  );

  const ci = workflowNodeVersions(
    await read(".github/workflows/deploy-vercel.yml"),
  );
  assert.ok(ci.length > 0, "CI workflow declares no node-version");
  for (const version of ci) assert.equal(version, nvmrc);

  const images = dockerImages(await read("Dockerfile"));
  assert.ok(images.length > 0, "Dockerfile has no FROM images");
  for (const image of images)
    assert.ok(isPinnedImage(image), `Floating Docker tag: ${image}`);
  const node = images.filter((image) => /(^|\/)node[:@]/.test(image));
  assert.equal(node.length, 1, "expected exactly one node image");
  assert.ok(
    imageTag(node[0]) === nvmrc || imageTag(node[0]).startsWith(`${nvmrc}-`),
    `Dockerfile ${node[0]} does not match .nvmrc ${nvmrc}`,
  );

  assert.deepEqual(
    unpinnedRequirements(await read("backend/requirements.txt")),
    [],
  );

  const lock = JSON.parse(await read("frontend/package-lock.json"));
  assert.deepEqual(lockfileDrift(pkg, lock), []);
});

// --- Helper edge cases ---------------------------------------------------

test("parseNvmrc accepts trailing LF/CRLF and rejects inexact values", () => {
  assert.equal(parseNvmrc("25.9.0\n"), "25.9.0");
  assert.equal(parseNvmrc("25.9.0\r\n"), "25.9.0");
  for (const bad of ["v25.9.0", "25", "25.9", "lts/*", "node", "", "25.9.0.1"])
    assert.throws(() => parseNvmrc(bad), /exact x\.y\.z/, bad);
});

test("satisfies handles bounds and rejects unsupported syntax", () => {
  const range = ">=24.14.0 <26";
  for (const ok of ["24.14.0", "24.14.1", "25.9.0", "25.99.99"])
    assert.equal(satisfies(ok, range), true, ok);
  for (const no of ["24.13.9", "22.0.0", "26.0.0", "26.1.0"])
    assert.equal(satisfies(no, range), false, no);
  assert.equal(satisfies("25.9.0", "25.9.0"), true);
  assert.equal(satisfies("25.9.0", ">25.9.0"), false);
  assert.equal(satisfies("25.9.0", "<=25.9.0"), true);
  for (const bad of ["^25.0.0", "~25.9", ">=24 || >=26", "25.x", ""])
    assert.throws(() => satisfies("25.9.0", bad), Error, bad);
});

test("workflowNodeVersions collects every entry and strips quotes/comments", () => {
  const yaml = [
    "jobs:",
    "  a:",
    "    steps:",
    "      - uses: actions/setup-node@abc # v4",
    "        with:",
    "          node-version: 25.9.0",
    "  b:",
    "    steps:",
    "      - with:",
    "          node-version: '25.9.0' # pinned",
    '          node-version: "24"\r',
    "      - with: { cache: npm }",
  ].join("\n");
  assert.deepEqual(workflowNodeVersions(yaml), ["25.9.0", "25.9.0", "24"]);
  assert.deepEqual(workflowNodeVersions("steps: []\n"), []);
});

test("dockerImages handles --platform, AS stages, and stage references", () => {
  const dockerfile = [
    "# FROM node:latest (comment)",
    "FROM --platform=$BUILDPLATFORM node:25.9.0-slim AS build\r",
    "from python:3.12.15-slim as runtime",
    "FROM build",
    "FROM runtime AS final",
  ].join("\n");
  assert.deepEqual(dockerImages(dockerfile), [
    "node:25.9.0-slim",
    "python:3.12.15-slim",
  ]);
});

test("isPinnedImage rejects floating tags", () => {
  for (const ok of [
    "node:25.9.0-slim",
    "python:3.12.15-slim",
    "python:3.12.15",
    "registry.example:5000/library/node:25.9.0",
    `node@sha256:${"a".repeat(64)}`,
  ])
    assert.equal(isPinnedImage(ok), true, ok);
  for (const bad of [
    "node",
    "node:latest",
    "node:25-slim",
    "node:25",
    "python:3.12-slim",
    "python:slim",
    "registry.example:5000/node",
  ])
    assert.equal(isPinnedImage(bad), false, bad);
});

test("unpinnedRequirements flags anything that is not an exact == pin", () => {
  const text = [
    "# comment line",
    "",
    "   ",
    "fastapi==0.115.0",
    "uvicorn[standard]==0.30.0  # inline comment",
    "pydantic-core==2.41.5\r",
    "httpx>=0.27",
    "pytest",
    "starlette~=0.38.6",
    "anyio==4.*",
    "idna===3.7",
    "requests==2.0; python_version<'3.8'",
  ].join("\n");
  assert.deepEqual(unpinnedRequirements(text), [
    "httpx>=0.27",
    "pytest",
    "starlette~=0.38.6",
    "anyio==4.*",
    "idna===3.7",
    "requests==2.0; python_version<'3.8'",
  ]);
});

test("lockfileDrift detects version, dependency and lockfile-format drift", () => {
  const pkg = {
    dependencies: { react: "^19.3.0" },
    devDependencies: { vite: "^8.3.4" },
  };
  const lock = (root, lockfileVersion = 3) => ({
    lockfileVersion,
    packages: { "": root },
  });
  assert.deepEqual(lockfileDrift(pkg, lock({ ...pkg })), []);
  assert.equal(
    lockfileDrift(pkg, lock({ ...pkg, dependencies: { react: "^19.2.0" } }))
      .length,
    1,
  );
  assert.equal(
    lockfileDrift(pkg, lock({ dependencies: pkg.dependencies })).length,
    1,
  );
  assert.equal(lockfileDrift(pkg, lock({ ...pkg }, 2)).length, 1);
  assert.equal(lockfileDrift(pkg, { lockfileVersion: 3 }).length, 2);
});
