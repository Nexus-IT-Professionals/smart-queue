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
// Recording-only smoothing (like the click highlights; the application source is not changed):
// a full-viewport "curtain" pseudo-element dips to the app background (#f3f5f9) around route,
// view and slide changes, so the viewer sees a short fade instead of an instant switch. Every new
// document starts covered (no blank first paint, no visible slide flipping) until the script
// reveals it. `!important` keeps the fade under the app's reduced-motion rule.
const CURTAIN_IN = 300;
const CURTAIN_OUT = 380;
await context.addInitScript(
  ({ color, fadeIn, fadeOut }) => {
    const css = `html::after{content:"";position:fixed;inset:0;background:${color};opacity:1;pointer-events:none;z-index:2147483647}html[data-video-curtain=open]::after{opacity:0;transition:opacity ${fadeOut}ms ease-in-out !important}html[data-video-curtain=closing]::after{opacity:1;transition:opacity ${fadeIn}ms ease-in-out !important}`;
    const add = () => {
      const style = document.createElement("style");
      style.dataset.videoCurtain = "true";
      style.textContent = css;
      document.documentElement.appendChild(style);
    };
    if (document.documentElement) add();
    else
      new MutationObserver((_, observer) => {
        if (!document.documentElement) return;
        observer.disconnect();
        add();
      }).observe(document, { childList: true });
  },
  { color: "#f3f5f9", fadeIn: CURTAIN_IN, fadeOut: CURTAIN_OUT },
);
const before = Date.now();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function curtain(state) {
  if (page.url() === "about:blank") return;
  await page.evaluate((s) => {
    document.documentElement.dataset.videoCurtain = s;
  }, state);
  // Hold a little once closed so the swap underneath is never seen through a nearly opaque curtain.
  await pause(state === "open" ? CURTAIN_OUT : CURTAIN_IN + 120);
}
// Eased (cubic in-out) window scroll so the target glides into place instead of jumping.
async function scrollToElement(locator, { margin = 105, center = false, ms = 700 } = {}) {
  await locator.evaluate(
    (el, { margin, center, ms }) => {
      const rect = el.getBoundingClientRect();
      const max = document.documentElement.scrollHeight - innerHeight;
      const wanted = center
        ? rect.top + scrollY - (innerHeight - rect.height) / 2
        : rect.top + scrollY - margin;
      const from = scrollY;
      const to = Math.max(0, Math.min(max, wanted));
      if (ms === 0 || Math.abs(to - from) < 4) {
        window.scrollTo({ top: to, behavior: "instant" });
        return;
      }
      return new Promise((done) => {
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / ms);
          const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
          window.scrollTo({ top: from + (to - from) * e, behavior: "instant" });
          if (p < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      });
    },
    { margin, center, ms },
  );
}
async function highlight(locator) {
  const offscreen = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top < 60 || r.bottom > innerHeight - 20;
  });
  if (offscreen) await scrollToElement(locator, { center: true });
  await locator.evaluate((el) => {
    el.dataset.videoHighlight = "true";
    el.style.outline = "3px solid #159b8b";
    el.style.outlineOffset = "4px";
  });
}
async function unhighlight() {
  await page.evaluate(() =>
    document.querySelectorAll("[data-video-highlight]").forEach((el) => {
      el.style.outline = "";
      el.style.outlineOffset = "";
      delete el.dataset.videoHighlight;
    }),
  );
}
// In-place click: highlight, dwell, click, keep the highlight briefly so the change registers.
async function click(locator) {
  await highlight(locator);
  await pause(420);
  await locator.click({ delay: 100 });
  await pause(250);
  await unhighlight();
}
// A click that switches route/view: highlight, then fade to the curtain, click, scroll the new
// view to its target while covered, and fade back in.
async function switchView(locator, target) {
  await highlight(locator);
  await pause(420);
  await curtain("closing");
  await locator.click({ delay: 100 });
  await unhighlight();
  await expect(target()).toBeVisible();
  await scrollToElement(target(), { ms: 0 });
  await pause(150);
  await curtain("open");
}
async function focus(locator) {
  await scrollToElement(locator);
  await pause(250);
}
// Opens the offline deck (controls hidden) at the given story slide; the slide flipping and the
// page load happen under the curtain.
async function presentation(slide = 1) {
  await curtain("closing");
  await page.goto(`${base}/presentation/index.html`);
  await page.addStyleTag({
    content: ".controls {visibility:hidden !important}",
  });
  for (let i = 1; i < slide; i++) await page.keyboard.press("ArrowRight");
  await page
    .locator(".slide:visible img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await pause(120);
  await curtain("open");
}
await presentation();
await pause(300);
const timeline = [];
async function scene(index, action) {
  const start = Date.now();
  const offset = (start - before) / 1000;
  console.log(`Scene ${index + 1}: ${scenes[index].title}`);
  // Hold still for half of render.py's default 0.8 s crossfade (VIDEO_XFADE), so the blend
  // across the cue runs over a still frame and the scene's first motion starts after it.
  if (index > 0) await pause(400);
  await action();
  const elapsed = (Date.now() - start) / 1000;
  if (elapsed > scenes[index].duration)
    throw Error(`Scene ${index + 1} actions took ${elapsed}s`);
  console.log(`  actions ${elapsed.toFixed(2)}s of ${scenes[index].duration}s`);
  await pause((scenes[index].duration - elapsed) * 1000);
  await page.screenshot({
    path: `${work}/scene-${String(index).padStart(2, "0")}.png`,
  });
  timeline.push({ index, offset, duration: scenes[index].duration });
}
const button = (name) => page.getByRole("button", { name, exact: true });
await scene(0, async () => {});
// The single demo story: María cancels → the AI assistant (simulated) detects,
// selects José and offers → José accepts → the assistant updates the schedule
// and notifies Ana. Role switches use the header's "Demo workspace" group.
const role = (name) =>
  page
    .getByRole("group", { name: "Demo workspace" })
    .getByRole("button", { name, exact: true });
const feed = () => page.locator(".ai-feed-panel");
// Ana's manual work today: the deck's Ana character slide.
await scene(1, async () => {
  await presentation(3);
});
await scene(2, async () => {
  await curtain("closing");
  await page.goto(`${base}/#/provider`);
  await expect(page.getByRole("row").filter({ hasText: "SQ-006" })).toContainText(
    "María Rodríguez",
  );
  await pause(150);
  await curtain("open");
  await pause(500);
  await switchView(role("María (patient)"), () => page.locator(".patient-appointment"));
  await pause(900);
  await click(button("Cancel my appointment"));
  await pause(1600);
  await click(button("Yes, cancel my appointment"));
  await expect(page.locator(".response-notice")).toBeVisible();
});
await scene(3, async () => {
  await switchView(role("Ana (office)"), feed);
  await expect(feed()).toContainText("Best match selected");
});
await scene(4, async () => {
  const reasoning = page.locator(".ai-reasoning");
  await focus(reasoning);
  await expect(reasoning).toContainText("the oldest request wins (Oct 4)");
  await expect(reasoning).toContainText("Next in line: Elena Morales");
});
await scene(5, async () => {
  await switchView(role("José (patient)"), () => page.locator(".offer-panel"));
  await expect(page.locator(".offer-panel")).toContainText("14 days earlier");
});
await scene(6, async () => {
  await pause(800);
  await click(button("Accept earlier visit"));
  await pause(2200);
  await click(button("Yes, move my appointment"));
  await expect(page.locator(".success-head")).toBeVisible();
  await focus(page.locator(".patient-appointment"));
});
await scene(7, async () => {
  await switchView(button("See what the office sees"), () =>
    page.locator(".schedule-panel"),
  );
  await expect(page.getByRole("row").filter({ hasText: "SQ-006" })).toContainText(
    "José Pérez",
  );
});
await scene(8, async () => {
  const notification = page.getByRole("region", {
    name: "Notification for Ana Martínez",
  });
  await focus(notification);
  await expect(notification).toContainText("No action needed");
});
let dashboard;
await scene(9, async () => {
  dashboard = page.locator(".capacity-dashboard");
  await switchView(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Capacity", exact: true }),
    () => dashboard,
  );
  await expect(
    dashboard.locator(".metric-card").filter({ hasText: "Total capacity" }),
  ).toContainText("440");
  const toggle = dashboard.getByRole("group", { name: "Statistics period" });
  await pause(700);
  await click(toggle.getByRole("button", { name: "Week", exact: true }));
  await pause(1300);
  await click(toggle.getByRole("button", { name: "Day", exact: true }));
  await pause(1300);
  await click(toggle.getByRole("button", { name: "Month", exact: true }));
  await focus(dashboard.locator(".capacity-kpis"));
});
// Why it's different: the deck's "Why Smart Queue" slide (refill workflow, English / Español).
await scene(10, async () => {
  await presentation(6);
});
await scene(11, async () => {
  await presentation(12);
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
