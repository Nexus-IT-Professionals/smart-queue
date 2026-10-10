import { expect, test } from "@playwright/test";

test("local synthetic scenario relays cancellation and confirmed reassignment only", async ({ page }) => {
  const events: Record<string, unknown>[] = [];
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { status: "ok" } }),
  );
  await page.route("**/api/local-demo/events", async (route) => {
    events.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: 202, json: { accepted: true, event_ids: [] } });
  });

  await page.goto("/#/demo");
  await page.getByRole("button", { name: "Start the guided demo" }).click();
  await page.getByRole("button", { name: "Cancel my appointment" }).click();
  await page.getByRole("button", { name: "Yes, cancel my appointment" }).click();
  await expect.poll(() => events.length).toBe(1);

  await page.getByRole("button", { name: "Open José's view" }).click();
  await page.getByRole("button", { name: "Accept earlier visit" }).click();
  await page.getByRole("button", { name: "Yes, move my appointment" }).click();
  await expect.poll(() => events.length).toBe(2);

  expect(events.map((event) => event.kind)).toEqual(["cancelled", "updated"]);
  for (const event of events) {
    expect(event.appointment_date).toBe("2026-10-08");
    expect(event.appointment_time).toBe("2:00 PM");
    expect(event.event_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(event.correlation_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(Object.keys(event).sort()).toEqual([
      "appointment_date", "appointment_time", "correlation_id", "event_id", "kind",
    ]);
    expect(JSON.stringify(event)).not.toMatch(/María|José|diagnosis|condition/i);
  }
  expect(events[0].correlation_id).toBe(events[1].correlation_id);
});
