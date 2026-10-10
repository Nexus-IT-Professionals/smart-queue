import { test, expect } from "@playwright/test";
import { switchRole, translator } from "./story";

const es = translator("es");

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
    await page.getByRole("button", { name: "Continuar como Ana" }).click();
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
    // María cancels in Spanish; the AI assistant (simulated) offers José.
    await switchRole(page, "maria", es);
    await page.getByRole("button", { name: "Cancelar mi cita", exact: true }).click();
    await page
      .getByRole("button", { name: "Sí, cancelar mi cita", exact: true })
      .click();
    await expect(page.locator(".demo-scenario [role=status]")).toHaveText(
      "Cancelada. El asistente de IA (simulado) ofreció su horario de las 2:00 p. m. a un paciente en espera.",
    );
    await switchRole(page, "ana", es);
    await expect(page.locator(".ai-feed")).toContainText("Asistente de IA (simulado)");
    await page.screenshot({
      path: test.info().outputPath(`spanish-provider-${width}.png`),
      fullPage: true,
    });
    await switchRole(page, "jose", es);
    await page
      .getByRole("button", { name: "Aceptar cita más cercana", exact: true })
      .click();
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Yes, move my appointment", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await page
      .getByRole("button", { name: "Sí, mover mi cita", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "jueves, 8 de octubre", exact: true }),
    ).toBeVisible();
    await switchRole(page, "ana", es);
    await expect(
      page.getByRole("region", { name: "Notificación para Ana Martínez" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Revisar actividad" }).click();
    await expect(page.locator(".timeline")).toContainText(
      "José Pérez aceptó la cita más cercana",
    );
    await expect(page.locator(".timeline")).toContainText(
      "Notificó a Ana Martínez, asistente de oficina médica",
    );
    await page.getByRole("button", { name: /^Lista de espera/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Lista de espera",
    );
    await expect(page.getByText(/Desde/).first()).toContainText("oct");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(
      page.getByRole("row").filter({ hasText: "SQ-006" }),
    ).toContainText("María Rodríguez");
  });
}

test("Spanish empty states; María backing out preserves her appointment", async ({
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
  // Other dates are chosen on the Schedule (Agenda); the Overview is the demo day.
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
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
  await switchRole(page, "maria", es);
  await page.getByRole("button", { name: "Cancelar mi cita", exact: true }).click();
  await page.getByRole("button", { name: "Mantener mi cita", exact: true }).click();
  await expect(page.locator(".appointment-footer")).toContainText(
    "Programada · ejemplo",
  );
  await expect(
    page.getByRole("heading", { name: "jueves, 8 de octubre", exact: true }),
  ).toBeVisible();
  await switchRole(page, "jose", es);
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
    .getByRole("button", { name: "Continuar como José" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mi cita", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
