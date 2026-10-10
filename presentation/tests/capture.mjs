// Run after serving frontend/dist at http://127.0.0.1:8001 (or set CAPTURE_BASE_URL).
// Walks the single demo story with real clicks: María cancels → the AI assistant
// (simulated) selects José and offers → José accepts → the AI updates the
// schedule and notifies Ana. No application data or logic is injected.
import { chromium } from "../../frontend/node_modules/@playwright/test/index.mjs";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
const base = process.env.CAPTURE_BASE_URL || "http://127.0.0.1:8001";
const output = fileURLToPath(
	new URL("../assets/screenshots/", import.meta.url),
);
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1440, height: 1000 },
	deviceScaleFactor: 2,
	locale: "en-US",
	reducedMotion: "reduce",
});
// Encode fresh screenshots at native resolution without storing intermediate PNGs.
const encoder = await browser.newPage();
const sizes = [];
async function save(png, name) {
	const encoded = await encoder.evaluate(async (source) => {
		const image = new Image();
		image.src = source;
		await image.decode();
		const canvas = document.createElement("canvas");
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;
		canvas.getContext("2d").drawImage(image, 0, 0);
		const result = canvas.toDataURL("image/webp", 0.96);
		if (!result.startsWith("data:image/webp"))
			throw Error("WebP encoder unavailable");
		return [result.split(",")[1], canvas.width, canvas.height];
	}, `data:image/png;base64,${png.toString("base64")}`);
	await writeFile(`${output}${name}.webp`, Buffer.from(encoded[0], "base64"));
	sizes.push(`${name}.webp ${encoded[1]}×${encoded[2]}`);
}
const capture = async (locator, name) =>
	save(await locator.screenshot({ animations: "disabled" }), name);
const button = (name) => page.getByRole("button", { name, exact: true });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

// 1. María, in her own patient view, is asked to confirm the cancellation.
await page.goto(`${base}/#/patient/maria`);
await button("Cancel my appointment").click();
await capture(page.locator(".patient-appointment"), "maria-cancel");
await button("Yes, cancel my appointment").click();

// 2–4. The assistant detects, selects and offers; José sees the offer and confirms.
await page.getByRole("button", { name: "Open José's view" }).click();
await button("Accept earlier visit").click();
await capture(page.locator(".offer-panel"), "jose-offer");
await button("Yes, move my appointment").click();

// 6–7. Ana's office view: the notification, then the updated SQ-006 row.
await page.getByRole("button", { name: "See what the office sees" }).click();
const notification = page.getByRole("region", {
	name: "Notification for Ana Martínez",
});
await notification.waitFor();
await capture(notification, "ana-notification");
await page.getByRole("searchbox").fill("SQ-006");
const scheduleRows = page.locator(".schedule-panel table");
await scheduleRows.getByRole("row").filter({ hasText: "José Pérez" }).waitFor();
await capture(scheduleRows, "updated-schedule");

// 2–4 (reasoning). The AI activity feed's detect → select → offer steps, at a
// width where the feed column is readable.
await page.setViewportSize({ width: 1200, height: 1000 });
await page.evaluate(() => scrollTo(0, 0));
const steps = page.locator(".ai-feed > li");
const first = await steps.nth(1).boundingBox();
const last = await steps.nth(3).boundingBox();
const panel = await page.locator(".ai-feed-panel").boundingBox();
const top = first.y - 12;
await save(
	await page.screenshot({
		fullPage: true,
		animations: "disabled",
		clip: {
			x: panel.x,
			y: top,
			width: panel.width,
			height: last.y + last.height - top,
		},
	}),
	"ai-reasoning",
);
if (errors.length) throw new Error(errors.join("\n"));
console.log(`Captured five real synthetic POC panels as WebP:\n${sizes.join("\n")}`);
await browser.close();
