// Run after serving frontend/dist at http://127.0.0.1:8001.
import { chromium } from "../../frontend/node_modules/@playwright/test/index.mjs";
import { fileURLToPath } from "node:url";
const output = fileURLToPath(
	new URL("../assets/screenshots/", import.meta.url),
);
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1440, height: 1000 },
	deviceScaleFactor: 2,
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:8001/#/provider");
await page
	.locator(".demo-scenario")
	.screenshot({ path: `${output}cancellation.png` });
await page
	.getByRole("button", { name: "Confirm demo cancellation", exact: true })
	.click();
await page
	.locator(".demo-scenario")
	.screenshot({ path: `${output}open-slot.png` });
await page
	.getByRole("button", { name: "Send demo offer to Elena", exact: true })
	.click();
await page.getByRole("button", { name: "Patient view", exact: true }).click();
await page
	.getByRole("button", { name: "Preview acceptance", exact: true })
	.click();
await page
	.locator(".offer-panel")
	.screenshot({ path: `${output}patient-confirmation.png` });
await page
	.getByRole("button", { name: "Confirm preview", exact: true })
	.click();
await page.getByRole("button", { name: "Provider view", exact: true }).click();
await page
	.getByRole("navigation", { name: "Main navigation" })
	.getByRole("button", { name: "Schedule", exact: true })
	.click();
await page.getByRole("searchbox").fill("SQ-006");
await page
	.locator(".schedule-panel")
	.screenshot({ path: `${output}updated-schedule.png` });
await page
	.getByRole("button", { name: "Review activity", exact: true })
	.click();
await page
	.locator(".activity-panel")
	.screenshot({ path: `${output}activity.png` });
if (errors.length) throw new Error(errors.join("\n"));
console.log("Captured five real, unmodified synthetic POC panels.");
await browser.close();
