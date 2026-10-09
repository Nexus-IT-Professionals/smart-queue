import test from "node:test";
import assert from "node:assert/strict";
import {
  demoWorkspaceFromHash,
  demoReducer,
  initialDemoState,
  demoAppointments,
  demoWaitlist,
} from "../src/demo/data.ts";
const slot = (state) =>
  demoAppointments(state).find((row) => row.id === "SQ-006");
const offer = () =>
  demoReducer(demoReducer(initialDemoState(), { type: "cancel" }), {
    type: "offer",
  });

test("public entry, login alias, direct role links and unknown routes never require credentials", () => {
  for (const hash of ["", "#/demo", "#/login", "#/unknown"])
    assert.equal(demoWorkspaceFromHash(hash), "demo");
  assert.equal(demoWorkspaceFromHash("#/provider"), "staff");
  assert.equal(demoWorkspaceFromHash("#/staff"), "staff");
  assert.equal(demoWorkspaceFromHash("#/patient"), "patient");
});
test("cancellation to offer to acceptance updates schedule, waitlist and activity", () => {
  let state = initialDemoState();
  assert.equal(slot(state).status, "Scheduled");
  state = demoReducer(state, { type: "cancel" });
  assert.equal(slot(state).status, "Open slot");
  state = demoReducer(state, { type: "offer" });
  for (const hash of ["#/patient", "#/demo", "#/login", "#/provider"])
    demoWorkspaceFromHash(hash);
  assert.equal(state.phase, "offered");
  state = demoReducer(state, { type: "respond", response: "accepted" });
  assert.equal(slot(state).name, "Elena Morales");
  assert.equal(slot(state).status, "Scheduled");
  assert.equal(demoWaitlist(state).length, 2);
  assert.equal(state.events.length, 3);
  assert.deepEqual(
    demoReducer(state, { type: "respond", response: "accepted" }),
    state,
  );
});
test("out-of-order and duplicate provider actions do not mutate the demo", () => {
  const initial = initialDemoState();
  assert.equal(demoReducer(initial, { type: "offer" }), initial);
  assert.equal(
    demoReducer(initial, { type: "respond", response: "accepted" }),
    initial,
  );
  const offered = offer();
  assert.equal(demoReducer(offered, { type: "cancel" }), offered);
  assert.equal(demoReducer(offered, { type: "offer" }), offered);
});
test("decline preserves waitlist and open capacity; help permits a later answer", () => {
  const declined = demoReducer(offer(), {
    type: "respond",
    response: "declined",
  });
  assert.equal(slot(declined).status, "Open slot");
  assert.equal(demoWaitlist(declined).length, 3);
  assert.equal(
    demoReducer(declined, { type: "respond", response: "accepted" }),
    declined,
  );
  const help = demoReducer(offer(), { type: "respond", response: "help" });
  assert.equal(demoReducer(help, { type: "respond", response: "help" }), help);
  assert.equal(
    demoReducer(help, { type: "respond", response: "accepted" }).phase,
    "accepted",
  );
});
test("reset and independent judge sessions do not share state", () => {
  const first = demoReducer(offer(), { type: "respond", response: "accepted" });
  const second = initialDemoState();
  assert.equal(slot(second).name, "Adrián López");
  assert.equal(second.events.length, 0);
  const reset = demoReducer(first, { type: "reset" });
  assert.deepEqual(reset, second);
  assert.equal(demoWaitlist(reset).length, 3);
});

test("demo health request omits credentials and preserves abort signal", async () => {
  const { getHealth } = await import("../src/api/client.ts");
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ status: "ok" }) };
  };
  try {
    assert.deepEqual(await getHealth(controller.signal), { status: "ok" });
    assert.equal(request.url, "/api/health");
    assert.equal(request.options.credentials, "omit");
    assert.equal(request.options.signal, controller.signal);
    assert.equal(request.options.body, undefined);
    assert.equal(request.options.headers.Authorization, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
