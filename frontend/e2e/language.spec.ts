import { test, expect } from "@playwright/test";

for (const width of [320, 768, 1440]) {
  test(`Spanish workflow and language switching preserve state at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/demo");
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Explore la atención sin la espera.",
    );
    await page
      .getByRole("button", { name: "Continuar como proveedor demo" })
      .click();
    await page
      .getByRole("combobox", { name: "Estado de la cita" })
      .selectOption("Completed");
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(
      page.getByRole("combobox", { name: "Appointment status" }),
    ).toHaveValue("Completed");
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Estado de la cita" })
      .selectOption("All statuses");
    await page
      .getByRole("button", { name: "Confirmar cancelación demo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Enviar oferta demo a José" })
      .click();
    await page.screenshot({
      path: test.info().outputPath(`spanish-provider-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Vista del paciente" }).click();
    await page
      .getByRole("button", { name: "Necesito ayuda", exact: true })
      .click();
    await expect(
      page.getByText(
        "Solicitud de ayuda de prueba registrada. No se envió ningún mensaje al consultorio.",
      ),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Revisar aceptación", exact: true })
      .click();
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Confirm preview", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await page
      .getByRole("button", { name: "Confirmar prueba", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "jueves, 8 de octubre", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Vista del proveedor" }).click();
    await page.getByRole("button", { name: "Revisar actividad" }).click();
    await expect(page.locator(".timeline")).toContainText("El paciente aceptó");
    await page.getByRole("button", { name: /^Lista de espera/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "La próxima oportunidad de atención",
    );
    await expect(page.getByText(/Desde/).first()).toContainText("oct");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(
      page.getByRole("button", {
        name: "Confirmar cancelación demo",
        exact: true,
      }),
    ).toBeVisible();
  });
}

test("Spanish empty states and decline preserve the original appointment", async ({
  page,
}) => {
  await page.goto("/#/provider");
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await page.getByRole("searchbox").fill("no matching patient");
  await expect(
    page.getByRole("heading", { name: "No hay citas que coincidan" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restablecer filtros y fecha demo" })
    .click();
  await page
    .getByLabel("Fecha de la agenda", { exact: true })
    .fill("2026-10-09");
  await expect(
    page.getByRole("heading", {
      name: "No hay citas de ejemplo en esta fecha",
    }),
  ).toBeVisible();
  await expect(
    page
      .locator(".schedule-panel")
      .getByText("viernes, 9 de octubre", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restablecer filtros y fecha demo" })
    .click();
  await page
    .getByRole("button", { name: "Confirmar cancelación demo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enviar oferta demo a José" })
    .click();
  await page.getByRole("button", { name: "Vista del paciente" }).click();
  await page.getByRole("button", { name: "Mantener mi cita actual" }).click();
  await expect(
    page.getByText(
      "Rechazo de prueba registrado. Su cita existente no cambia.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "jueves, 22 de octubre", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reiniciar la demo", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("language switching works when browser preference storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.goto("/#/login");
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await page
    .getByRole("button", { name: "Continuar como paciente demo" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Su atención, un poco más cerca." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
