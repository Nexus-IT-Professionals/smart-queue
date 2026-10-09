import test from "node:test";
import assert from "node:assert/strict";
import { symlinkSkipReason } from "./symlink-support.mjs";

const refuse = (code) => async () => {
  throw Object.assign(new Error(`synthetic ${code}`), { code });
};

test("symlink guard tests run when symlink creation succeeds", async () => {
  let calls = 0;
  const link = async () => {
    calls++;
  };
  assert.equal(await symlinkSkipReason({ link, platform: "win32" }), false);
  assert.equal(await symlinkSkipReason({ link, platform: "linux" }), false);
  assert.equal(calls, 2);
});
for (const code of ["EPERM", "EACCES"]) {
  test(`symlink guard tests skip with a reason on Windows ${code}`, async () => {
    const reason = await symlinkSkipReason({
      link: refuse(code),
      platform: "win32",
    });
    assert.match(reason, new RegExp(`refused symlink creation \\(${code}\\)`));
  });
  test(`symlink ${code} outside Windows still fails`, async () => {
    await assert.rejects(
      symlinkSkipReason({ link: refuse(code), platform: "linux" }),
      { code },
    );
  });
}
test("other symlink errors still fail on Windows", async () => {
  await assert.rejects(
    symlinkSkipReason({ link: refuse("ENOENT"), platform: "win32" }),
    { code: "ENOENT" },
  );
});
