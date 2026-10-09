import {
	chromium,
	expect,
} from "../../frontend/node_modules/@playwright/test/index.mjs";
import { mkdir } from "node:fs/promises";
const url = new URL("../index.html", import.meta.url).href;
const output =
	process.env.PRESENTATION_QA_DIR || "/tmp/smart-queue-presentation-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
	viewport: { width: 1600, height: 1000 },
	offline: true,
	reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [],
	external = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
	if (/^https?:/.test(request.url())) external.push(request.url());
});
await page.goto(url);
await expect(page.locator("#estimate")).toHaveText("Talk 2:40");
for (let i = 1; i <= 12; i++) {
	await expect(page.locator(".slide:visible")).toHaveCount(1);
	await expect(page.locator(".slide:visible")).toHaveAttribute(
		"data-slide",
		String(i),
	);
	await expect(page.locator("#counter")).toHaveText(`${i} / 12`);
	await page
		.locator(".slide:visible img")
		.evaluateAll((images) =>
			Promise.all(images.map((image) => image.decode())),
		);
	const overflow = await page.locator(".slide:visible").evaluate((slide) =>
		[
			...slide.querySelectorAll(
				"h1,h2,p,blockquote,figure,.story-copy,.cast-labels,table",
			),
		]
			.filter((el) => {
				const a = el.getBoundingClientRect(),
					b = slide.getBoundingClientRect();
				return (
					a.left < b.left - 1 ||
					a.right > b.right + 1 ||
					a.bottom > b.bottom - 30 ||
					a.top < b.top
				);
			})
			.map((el) => el.className || el.tagName),
	);
	expect(overflow, `Slide ${i} stays in its canvas`).toEqual([]);
	await page
		.locator("#frame")
		.screenshot({ path: `${output}/slide-${String(i).padStart(2, "0")}.png` });
	await page.keyboard.press("ArrowRight");
}
await page.keyboard.press("Home");
await expect(page.locator("#counter")).toHaveText("1 / 12");
await page.keyboard.press("n");
await expect(page.locator("#notes")).toBeVisible();
await expect(page.locator("#note-title")).toContainText("9s");
await page.keyboard.press("Escape");
await expect(page.locator("#notes")).toBeHidden();
await page.getByRole("button", { name: "Start timer", exact: true }).click();
await expect(
	page.getByRole("button", { name: "Pause timer", exact: true }),
).toBeVisible();
await expect(page.locator("#timer")).not.toHaveText("0:00", { timeout: 3000 });
await page.keyboard.press("t");
await expect(
	page.getByRole("button", { name: "Start timer", exact: true }),
).toBeVisible();
await page.keyboard.press("r");
await expect(page.locator("#timer")).toHaveText("0:00");
await page.locator("#fullscreen").click();
await expect
	.poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
	.toBe(true);
await page.evaluate(() => document.exitFullscreen());
await page.locator("#mode").selectOption("submission");
await expect(page.locator("#estimate")).toHaveText("Talk 1:50");
for (const [index, slide] of [1, 2, 8, 9, 12].entries()) {
	await expect(page.locator(".slide:visible")).toHaveAttribute(
		"data-slide",
		String(slide),
	);
	await expect(page.locator("#counter")).toHaveText(`${index + 1} / 5`);
	if (index < 4) await page.locator("#next").click();
}
await page.goto(`${url}?mode=submission`);
await expect(page.locator("#counter")).toHaveText("1 / 5");
for (const viewport of [
	{ width: 1280, height: 720 },
	{ width: 1024, height: 768 },
	{ width: 390, height: 844 },
]) {
	await page.setViewportSize(viewport);
	await expect
		.poll(
			() =>
				page.locator("#frame").evaluate((el) => {
					const r = el.getBoundingClientRect();
					return (
						r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight
					);
				}),
			{ message: `Canvas fits ${viewport.width}` },
		)
		.toBe(true);
}
expect(errors).toEqual([]);
expect(external).toEqual([]);
await browser.close();
console.log(
	"PASS: 12 slides, 5-slide mode, offline assets, no external requests or JS errors, notes, timer, fullscreen, navigation, 3 viewport sizes; slide images in " +
		output,
);
