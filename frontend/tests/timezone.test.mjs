import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Rerun the formatter tests with the host clock in timezones far from Puerto
// Rico (UTC+9, UTC-10, and UTC+14, the only kind of zone where noon-UTC
// calendar dates land on the next day without the Puerto Rico pin). The child
// first proves the TZ override really applied, so a silently ignored TZ cannot
// pass as a false green. TZ is set here, not by the caller, because Git Bash
// drops TZ when launching native Windows programs (`TZ=Asia/Tokyo npm test`
// silently runs in the machine timezone there).
const localeTests = fileURLToPath(new URL("./locale.test.mjs", import.meta.url));
for (const timeZone of ["Asia/Tokyo", "Pacific/Honolulu", "Pacific/Kiritimati"]) {
  test(`locale tests pass with host timezone ${timeZone}`, () => {
    // NODE_TEST_CONTEXT would make the child report to this runner instead of
    // printing its own TAP summary, which the assertions below read.
    const { NODE_TEST_CONTEXT: _context, ...parentEnv } = process.env;
    const env = { ...parentEnv, TZ: timeZone };
    const probe = spawnSync(
      process.execPath,
      ["-p", "Intl.DateTimeFormat().resolvedOptions().timeZone"],
      { env, encoding: "utf8" },
    );
    assert.equal(probe.stdout.trim(), timeZone, probe.stderr);
    const run = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "--test",
        "--test-reporter=tap",
        localeTests,
      ],
      { env, encoding: "utf8" },
    );
    assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
    assert.match(run.stdout, /# fail 0/);
    assert.match(run.stdout, /# pass [1-9]/);
  });
}
