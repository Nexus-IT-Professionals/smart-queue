import { lstat, readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

// A narrow release guard, not a general secret or patient-data detector.
export async function verifyDemo(directory) {
  const files = [];
  async function visit(relative = "") {
    const path = join(directory, relative);
    const stat = await lstat(path);
    if (stat.isSymbolicLink())
      throw new Error(`Symlink forbidden: ${relative || "."}`);
    if (stat.isDirectory()) {
      if (relative && relative !== "assets")
        throw new Error(`Unexpected directory: ${relative}`);
      for (const name of await readdir(path))
        await visit(relative ? `${relative}/${name}` : name);
      return;
    }
    if (
      !stat.isFile() ||
      !/^(index\.html|assets\/[\w-]+-[\w-]+\.(js|css))$/.test(relative)
    ) {
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
  const policy = html.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/?\s*>/i,
  );
  const expected =
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'";
  if (
    !policy ||
    policy[1].replaceAll("&#39;", "'") !== expected ||
    html.indexOf(policy[0]) > html.search(/<script\b/i)
  ) {
    throw new Error("Missing or altered public-demo CSP before scripts");
  }
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (
      !match[1].startsWith("/assets/") ||
      !files.includes(match[1].slice(1))
    ) {
      throw new Error(
        "HTML must reference only emitted local assets at the site root",
      );
    }
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
