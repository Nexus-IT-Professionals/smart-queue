import {
	chromium,
	expect,
} from "../../frontend/node_modules/@playwright/test/index.mjs";
import { mkdir, readFile } from "node:fs/promises";
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
// The control bar holds exactly: previous, counter, next, Deck mode select, fullscreen.
const controlIds = await page
	.locator("nav.controls")
	.evaluate((nav) =>
		[...nav.querySelectorAll("button,select,input,[id]")].map((el) => el.id),
	);
expect(controlIds, "Control bar contents").toEqual([
	"previous",
	"counter",
	"next",
	"mode",
	"fullscreen",
]);
await expect(page.locator("nav.controls button")).toHaveCount(3);
await expect(page.locator("#counter")).toHaveText("1 / 12");
await expect(page.locator("#mode option")).toHaveText([
	"Story · 12 slides",
	"Submission · 5 slides",
]);
// Speaker notes panel and timer were removed; SPEAKER_NOTES.md is the source of truth.
for (const removed of [
	"#notes",
	"#notes-toggle",
	"#close-notes",
	"#note-title",
	"#timer",
	"#timer-toggle",
	"#timer-reset",
	"#estimate",
]) {
	await expect(page.locator(removed), `${removed} is absent`).toHaveCount(0);
}
const source = await readFile(new URL("../script.js", import.meta.url), "utf8");
for (const pattern of [
	/notes-toggle|close-notes|note-(title|script|cue)/,
	/timer|estimate|setInterval|toggleNotes|toggleTimer|resetTimer/,
]) {
	expect(source, `script.js has no ${pattern}`).not.toMatch(pattern);
}
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
// Former notes/timer shortcuts are inert: no panel appears, slide does not change.
for (const key of ["n", "t", "r", "Escape"]) await page.keyboard.press(key);
await expect(page.locator("#counter")).toHaveText("1 / 12");
await expect(page.locator("aside")).toHaveCount(0);
await page.keyboard.press("ArrowRight");
await expect(page.locator("#counter")).toHaveText("2 / 12");
await page.keyboard.press("ArrowLeft");
await expect(page.locator("#counter")).toHaveText("1 / 12");
await page.locator("body").press("f");
await expect
	.poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
	.toBe(true);
await page.evaluate(() => document.exitFullscreen());
await page.locator("#fullscreen").click();
await expect
	.poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
	.toBe(true);
await page.evaluate(() => document.exitFullscreen());
await page.locator("#mode").selectOption("submission");
await expect(page.locator("#counter")).toHaveText("1 / 5");
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
	"PASS: 12 slides, 5-slide mode, offline assets, no external requests or JS errors, exact control bar (prev/counter/next/mode/fullscreen; no notes or timer), fullscreen, navigation, 3 viewport sizes; slide images in " +
		output,
);
