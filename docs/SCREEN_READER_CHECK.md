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
5. **María.** Activate "María (patient)" [María (paciente)] in the role switch (from the
   entry page, "Start the guided demo" [Comenzar la demo guiada] does the same). Focus
   moves to main.
6. **Back out.** Activate "Cancel my appointment" [Cancelar mi cita]. Hear the group name
   "Confirm cancellation" [Confirmar cancelación] and the question "Cancel your October 8,
   2:00 PM appointment?" [¿Cancelar su cita del 8 de octubre a las 2:00 p. m.?]. Activate
   "Keep my appointment" [Mantener mi cita]: focus returns to "Cancel my appointment" and
   nothing changes.
7. **Cancellation.** Activate "Cancel my appointment", then "Yes, cancel my appointment"
   [Sí, cancelar mi cita]. Hear: "Appointment cancelled in this browser only. The AI
   assistant (simulated) is offering the time to a waiting patient." [Cita cancelada solo
   en este navegador. El asistente de IA (simulado) está ofreciendo el horario a un
   paciente en espera.]
8. **José.** Activate "José (patient)" [José (paciente)]. Focus moves to main; the offer
   says it comes from the AI assistant (simulated) [Asistente de IA (simulado)].
9. **Confirmation.** Activate "Accept earlier visit" [Aceptar cita más cercana]. Hear
   the group name "Confirm earlier visit" [Confirmar cita más cercana] and the question
   "Move your appointment to October 8 at 2:00 PM?" [¿Mover su cita al 8 de octubre a
   las 2:00 p. m.?]. `Tab` reaches "Yes, move my appointment" [Sí, mover mi cita] and
   "Go back" [Volver].
10. **Accept.** Activate "Yes, move my appointment". Hear: "Appointment moved to October 8
    at 2:00 PM. The AI assistant (simulated) updated the schedule and the waitlist and
    notified the office, in this browser only." [Cita adelantada al 8 de octubre a las
    2:00 p. m. El asistente de IA (simulado) actualizó la agenda y la lista de espera y
    notificó a la oficina, solo en este navegador.]
11. **Ana.** Activate "Ana (office)" [Ana (oficina)]. Focus moves to main and sidebar
    "Overview" announces "current page". Press `H`: reach "Notification for Ana Martínez"
    [Notificación para Ana Martínez] and "AI activity" [Actividad de la IA]. Each AI step
    is read with the label "AI assistant (simulated)" [Asistente de IA (simulado)], and
    the selection step lists its reasons as a list.
12. **Reset.** Switch back to José and activate "Reset demo scenario" [Reiniciar la demo].
    Focus moves to the patient card ("no offer" state) and it is read; no stale result
    message is announced.
13. **Back/forward.** Press `Alt+Left`, then `Alt+Right`. Focus returns to main each time
    and the page is still read in the selected language.

## Results

| Step | English (pass/fail, notes) | Spanish (pass/fail, notes) |
|---|---|---|
| 1 Skip link | | |
| 2 Landmarks | | |
| 3 Headings | | |
| 4 Pressed states | | |
| 5 María focus | | |
| 6 Back out (Keep my appointment) | | |
| 7 Cancellation announced | | |
| 8 José focus / offer read | | |
| 9 Confirmation read | | |
| 10 Acceptance announced | | |
| 11 Ana: notification and AI activity | | |
| 12 Reset focus | | |
| 13 Back/forward focus | | |

Reader and version: ______ · Browser version: ______ · Tester / date: ______
