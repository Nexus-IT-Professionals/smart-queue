// Run after serving frontend/dist at http://127.0.0.1:8001.
import { chromium } from "../../frontend/node_modules/@playwright/test/index.mjs";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
const output = fileURLToPath(
	new URL("../assets/screenshots/", import.meta.url),
);
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1440, height: 1000 },
	deviceScaleFactor: 2,
});
// Encode fresh screenshots at native resolution without storing intermediate PNGs.
const encoder = await browser.newPage();
async function capture(locator, name) {
  const png = await locator.screenshot();
  const encoded = await encoder.evaluate(async (source) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    const result = canvas.toDataURL("image/webp", 0.96);
    if (!result.startsWith("data:image/webp")) throw Error("WebP encoder unavailable");
    return result.split(",")[1];
  }, `data:image/png;base64,${png.toString("base64")}`);
  await writeFile(`${output}${name}.webp`, Buffer.from(encoded, "base64"));
}
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:8001/#/provider");
await capture(page.locator(".demo-scenario"), "cancellation");
await page
	.getByRole("button", { name: "Confirm demo cancellation", exact: true })
	.click();
await capture(page.locator(".demo-scenario"), "open-slot");
await page
	.getByRole("button", { name: "Send demo offer to José", exact: true })
	.click();
await page.getByRole("button", { name: "Patient view", exact: true }).click();
await page
	.getByRole("button", { name: "Preview acceptance", exact: true })
	.click();
await capture(page.locator(".offer-panel"), "patient-confirmation");
await page
	.getByRole("button", { name: "Confirm preview", exact: true })
	.click();
await page.getByRole("button", { name: "Provider view", exact: true }).click();
await page
	.getByRole("navigation", { name: "Main navigation" })
	.getByRole("button", { name: "Schedule", exact: true })
	.click();
await page.getByRole("searchbox").fill("SQ-006");
await capture(page.locator(".schedule-panel"), "updated-schedule");
if (errors.length) throw new Error(errors.join("\n"));
console.log("Captured four real synthetic POC panels as same-resolution WebP images.");
await browser.close();
