# Manual screen-reader check (UX-3)

> **Status: PENDING HUMAN ACCEPTANCE.** Automated tests check roles, names, states,
> focus and live-region *text*; they cannot confirm what a screen reader actually
> speaks. Complete this script once in English and once in Spanish and fill in the
> results table.

**Setup (about 15 minutes):** Windows 11, Microsoft Edge, the public demo (`npm run
build:demo && npm run preview`, then open `#/demo`). Start from a fresh tab.
For Spanish speech, install a Spanish voice (Settings > Time & language > Speech);
Narrator switches voice from the page's `lang` attribute.

## Keys

| Action | Windows Narrator (built in) | NVDA (optional) |
|---|---|---|
| Start / stop | `Win+Ctrl+Enter` | `Ctrl+Alt+N` / `Insert+Q` |
| Stop speaking | `Ctrl` | `Ctrl` |
| Scan / browse mode on or off | `Caps Lock+Space` | `Insert+Space` |
| Next / previous heading (scan mode) | `H` / `Shift+H` | `H` / `Shift+H` |
| Next / previous landmark (scan mode) | `D` / `Shift+D` | `D` / `Shift+D` |
| Next / previous item | `Caps Lock+Right` / `Caps Lock+Left` | `Down` / `Up` |
| Read focused item | `Caps Lock+Tab` | `Insert+Tab` |
| Move between controls | `Tab` / `Shift+Tab` | `Tab` / `Shift+Tab` |
| Activate button | `Enter` or `Space` (turn scan mode off first if a key is swallowed) | `Enter` or `Space` |

## Script

Run every step in English, then press **Español** and repeat. Expected speech is
paraphrased; wording order varies by reader. Spanish text is in brackets.

1. **Skip link.** Load `#/demo`, press `Tab`. Hear "Skip to main content, link"
   [Saltar al contenido principal]. Press `Enter`: focus lands on the main region.
2. **Landmarks.** Scan mode on, press `D` repeatedly. Hear banner, "Workspace sidebar"
   [Panel de navegación] complementary, "Main navigation"
   [Navegación principal] and main. (The page footer sits inside main, so it is not a
   separate landmark.)
3. **Headings.** Press `H` repeatedly. Exactly one level-1 heading per page, then
   level-2 card headings in reading order; none are empty.
4. **Role and language buttons.** `Tab` to the "Demo workspace" [Espacio de
   demostración] group. Each button announces its name plus "pressed"/"not pressed"
   (Narrator: "toggle button, on/off"). Only the current role and language say pressed.
5. **Provider.** Activate "Provider view" [Vista del proveedor]. Focus moves to main.
   Sidebar "Overview" announces "current page".
6. **Cancellation.** Activate "Confirm demo cancellation" [Confirmar cancelación demo].
   Hear: "Step 2: The slot is open. Offer it to Elena Morales, who is available in the
   afternoon." [Paso 2: El espacio está disponible. Ofrézcalo a Elena Morales, que tiene
   disponibilidad por la tarde.]
7. **Offer.** Activate "Send demo offer to Elena" [Enviar oferta demo a Elena]. Hear:
   "Step 3: Switch to Patient to respond to the simulated offer." [Paso 3: Cambie a
   Paciente para responder a la oferta simulada.]
8. **Patient.** Activate "Open Demo Patient" [Abrir paciente demo]. Focus moves to main.
9. **Help.** Activate "I need help" [Necesito ayuda]. Hear: "Help request preview
   recorded. No message was sent to the office." [Solicitud de ayuda de prueba
   registrada. No se envió ningún mensaje al consultorio.]
10. **Confirmation.** Activate "Preview acceptance" [Revisar aceptación]. Hear the group
    name "Confirm preview acceptance" [Confirmar aceptación de prueba] and the question
    "Preview accepting October 8 at 2:00 PM?" [¿Aceptar la cita de prueba del 8 de
    octubre a las 2:00 p. m.?]. `Tab` reaches "Confirm preview" [Confirmar prueba] and
    "Go back" [Volver].
11. **Accept.** Activate "Confirm preview". Hear: "Demo appointment moved to October 8 at
    2:00 PM. Provider schedule and waitlist updated in this browser only; no real booking
    was made." [Cita demo adelantada al 8 de octubre a las 2:00 p. m. Agenda y lista de
    espera actualizadas solo en este navegador; no se hizo una reserva real.]
12. **Reset.** Activate "Reset demo scenario" [Reiniciar la demo]. Focus moves to the
    patient card ("no offer" state) and it is read; no stale result message is announced.
13. **Decline path.** Repeat 5-8, then activate "Keep my current visit" [Mantener mi
    cita actual]. Hear: "Decline preview recorded. Your existing appointment is
    unchanged." [Rechazo de prueba registrado. Su cita existente no cambia.]
14. **Back/forward.** Press `Alt+Left`, then `Alt+Right`. Focus returns to main each time
    and the page is still read in the selected language.

## Results

| Step | English (pass/fail, notes) | Spanish (pass/fail, notes) |
|---|---|---|
| 1 Skip link | | |
| 2 Landmarks | | |
| 3 Headings | | |
| 4 Pressed states | | |
| 5 Provider / current page | | |
| 6 Cancellation announced | | |
| 7 Offer announced | | |
| 8 Patient focus | | |
| 9 Help announced | | |
| 10 Confirmation read | | |
| 11 Acceptance announced | | |
| 12 Reset focus | | |
| 13 Decline announced | | |
| 14 Back/forward focus | | |

Reader and version: ______ · Browser version: ______ · Tester / date: ______
