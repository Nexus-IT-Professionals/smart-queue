import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Windows without Developer Mode or elevation refuses symlink creation. Only
// that specific refusal skips symlink guard tests; any other error still fails.
export async function symlinkSkipReason({
  link = symlink,
  platform = process.platform,
} = {}) {
  const dir = await mkdtemp(join(tmpdir(), "queue-symlink-probe-"));
  try {
    await writeFile(join(dir, "target"), "probe");
    await link(join(dir, "target"), join(dir, "link"));
    return false;
  } catch (error) {
    if (
      platform === "win32" &&
      (error?.code === "EPERM" || error?.code === "EACCES")
    )
      return `OS refused symlink creation (${error.code}); enable Windows Developer Mode or run elevated to exercise this guard`;
    throw error;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
