// Record real UI interactions; no application data or business logic is injected.
import {
  chromium,
  expect,
} from "../../frontend/node_modules/@playwright/test/index.mjs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const scenes = JSON.parse(
  await readFile(new URL("./scenes.json", import.meta.url), "utf8"),
);
const work = process.env.VIDEO_WORK_DIR || "/tmp/smart-queue-video-work";
const base = process.env.VIDEO_BASE_URL || "http://127.0.0.1:4176";
await mkdir(work, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 800 },
  recordVideo: { dir: work, size: { width: 1600, height: 800 } },
  locale: "en-US",
  reducedMotion: "reduce",
});
context.setDefaultTimeout(5000);
const before = Date.now();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function click(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    el.dataset.videoHighlight = "true";
    el.style.outline = "3px solid #159b8b";
    el.style.outlineOffset = "4px";
  });
  await pause(420);
  await locator.click({ delay: 100 });
  await page.evaluate(() =>
    document.querySelectorAll("[data-video-highlight]").forEach((el) => {
      el.style.outline = "";
      el.style.outlineOffset = "";
      delete el.dataset.videoHighlight;
    }),
  );
}
async function focus(locator) {
  await locator.evaluate((el) => {
    const y = el.getBoundingClientRect().top + scrollY - 105;
    window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
  });
  await pause(250);
}
async function presentation(last = false) {
  await page.goto(`${base}/presentation/index.html`);
  await page.addStyleTag({
    content: ".controls {visibility:hidden !important}",
  });
  if (last) await page.keyboard.press("End");
  await page
    .locator(".slide:visible img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
}
await presentation();
await pause(300);
const timeline = [];
async function scene(index, action) {
  const start = Date.now();
  const offset = (start - before) / 1000;
  console.log(`Scene ${index + 1}: ${scenes[index].title}`);
  await action();
  const elapsed = (Date.now() - start) / 1000;
  if (elapsed > scenes[index].duration)
    throw Error(`Scene ${index + 1} actions took ${elapsed}s`);
  await pause((scenes[index].duration - elapsed) * 1000);
  await page.screenshot({
    path: `${work}/scene-${String(index).padStart(2, "0")}.png`,
  });
  timeline.push({ index, offset, duration: scenes[index].duration });
}
const button = (name) => page.getByRole("button", { name, exact: true });
await scene(0, async () => {});
await scene(1, async () => {
  await page.goto(`${base}/#/provider`);
  await expect(page.locator(".demo-scenario")).toContainText("cancellation");
  await focus(page.locator(".demo-scenario"));
});
await scene(2, async () => {
  await pause(900);
  await click(button("Confirm demo cancellation"));
  await focus(page.locator(".candidate-review"));
  await expect(page.locator(".candidate-review")).toContainText("José");
});
await scene(3, async () => {
  await click(
    page.getByRole("navigation").getByRole("button", { name: /^Waitlist/ }),
  );
  const jose = page
    .locator(".waitlist-person")
    .filter({ hasText: "José Pérez" });
  await focus(jose);
  await jose.getByRole("combobox").selectOption("P1");
  await pause(500);
  await click(jose.getByRole("checkbox"));
  await click(jose.getByRole("button", { name: "Save priority" }));
  await expect(jose).toContainText("P1");
});
await scene(4, async () => {
  await click(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Overview", exact: true }),
  );
  await focus(page.locator(".demo-scenario"));
  await pause(900);
  await click(button("Send demo offer to José"));
  await expect(page.locator(".demo-scenario")).toContainText("Patient");
});
await scene(5, async () => {
  await click(button("Patient view"));
  await focus(page.locator(".offer-panel"));
  await expect(page.locator(".offer-panel")).toContainText("14 days earlier");
});
await scene(6, async () => {
  await pause(800);
  await click(button("Preview acceptance"));
  await focus(page.locator(".offer-panel"));
  await pause(2200);
  await click(button("Confirm preview"));
  await expect(
    page.locator(".patient-workspace, .workspace-content").first(),
  ).toBeVisible();
  await focus(page.locator(".offer-panel"));
});
await scene(7, async () => {
  await click(button("Provider view"));
  await click(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Schedule", exact: true }),
  );
  await page.getByRole("searchbox").fill("SQ-006");
  await focus(page.locator(".schedule-panel"));
  await expect(page.locator(".schedule-panel")).toContainText("José Pérez");
});
let dashboard;
await scene(8, async () => {
  await click(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Capacity", exact: true }),
  );
  dashboard = page.locator(".capacity-dashboard");
  await focus(dashboard);
  await expect(
    dashboard.locator(".metric-card").filter({ hasText: "Total capacity" }),
  ).toContainText("440");
  const toggle = dashboard.getByRole("group", { name: "Statistics period" });
  await pause(700);
  await click(toggle.getByRole("button", { name: "Week", exact: true }));
  await pause(1100);
  await click(toggle.getByRole("button", { name: "Day", exact: true }));
  await pause(1000);
  await click(toggle.getByRole("button", { name: "Month", exact: true }));
  await focus(dashboard.locator(".capacity-kpis"));
});
await scene(9, async () => {
  await dashboard
    .getByLabel("Schedule date", { exact: true })
    .fill("2026-10-08");
  await click(
    dashboard
      .getByRole("group", { name: "Statistics period" })
      .getByRole("button", { name: "Day", exact: true }),
  );
  await click(
    dashboard
      .locator(".capacity-slots button")
      .filter({ hasText: "Scheduled" })
      .first(),
  );
  await focus(dashboard.locator(".capacity-actions"));
  await click(
    dashboard.getByLabel("Staff confirmation · synthetic scheduling only"),
  );
  await click(
    dashboard.getByRole("button", { name: "Cancel selected appointment" }),
  );
  await expect(
    dashboard.locator(".metric-card").filter({ hasText: "Occupied seats" }),
  ).toContainText("17");
  await focus(dashboard.locator(".capacity-kpis"));
});
await scene(10, async () => {
  await focus(dashboard.locator(".capacity-actions"));
  await click(
    dashboard.getByLabel("Staff confirmation · synthetic scheduling only"),
  );
  await click(
    dashboard.getByRole("button", { name: "Confirm waiting-list assignment" }),
  );
  await expect(
    dashboard
      .locator(".metric-card")
      .filter({ hasText: "Waiting-list fill rate" }),
  ).toContainText("50.0%");
  await focus(dashboard.locator(".capacity-kpis"));
});
await scene(11, async () => {
  await presentation(true);
});
if (errors.length) throw Error(errors.join("\n"));
const video = page.video();
await context.close();
await video.saveAs(`${work}/recording.webm`);
await writeFile(`${work}/timeline.json`, JSON.stringify(timeline, null, 2));
// Render a separate caption band, outside the application viewport.
const captions = await browser.newPage({
  viewport: { width: 1600, height: 100 },
  deviceScaleFactor: 1,
});
let elapsed = 0;
const timestamp = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  await captions.setContent(
    `<style>*{box-sizing:border-box}body{margin:0;background:#142747;color:#fff;font-family:Arial,sans-serif;padding:12px 34px}header{display:flex;justify-content:space-between;color:#82ddd0;font-size:15px;font-weight:bold;letter-spacing:.4px;margin-bottom:6px}p{font-size:22px;line-height:28px;margin:0;max-width:1530px}footer{position:absolute;bottom:0;left:0;height:3px;background:#82ddd0;width:${((i + 1) / 12) * 100}%}</style><header><span>${esc(s.title)}</span><span>${timestamp(elapsed)} – ${timestamp(elapsed + s.duration)}</span></header><p>${esc(s.text)}</p><footer></footer>`,
  );
  await captions.screenshot({
    path: `${work}/caption-${String(i).padStart(2, "0")}.png`,
  });
  elapsed += s.duration;
}
await browser.close();
console.log(
  "Recording complete; verified real UI outcomes and no page errors.",
);
