# Klicker

A mobile-first click-counter PWA.

## Features

- A large center button increments the current count on press.
- The current count is displayed above the button.
- The max count is displayed and updates live as the current count climbs; it is preserved before a reset.
- A small **Reset** button zeroes the current count, with a confirmation step to prevent accidental resets.
- A progress-to-record indicator shows how close the current count is to the max.
- Visual feedback: a subtle pulse on any button press, and a prominent celebration the moment the current count overtakes the previous max (a new record).
- Keyboard support (Space/Enter to increment) and large, thumb-friendly tap targets.
- A wake lock keeps the screen awake while counting.
- Theme toggle: **Dark**, **Light**, or **System**.
- Installable and works offline.
- Current count, max count, and theme preference persist across sessions.

## Tech stack

PWA built with HTML / CSS / TypeScript, bundled with **Vite** (`vite-plugin-pwa` for the manifest + offline service worker). Tests run on **Vitest**.

## Build plan

### Structure

```
klicker/
├─ index.html          # includes the reset confirmation modal markup
├─ src/
│  ├─ main.ts          # entry: wire DOM + events (incl. keyboard, wake lock, reset modal)
│  ├─ counter.ts       # current + record state, persistence, record detection
│  ├─ theme.ts         # dark / light / system, persistence
│  ├─ feedback.ts      # glow + flash celebration, press pulse
│  ├─ wakelock.ts      # screen wake lock acquire/release
│  └─ styles.css       # mobile-first layout, theme variables, animations, modal
├─ test/
│  ├─ counter.test.ts  # increment, reset, record preservation, record detection
│  └─ theme.test.ts    # theme resolution + persistence
├─ assets/
│  └─ icon.svg         # source icon; PNGs (192/512/maskable) generated from it
├─ public/             # generated PWA icons
├─ vite.config.ts      # vite-plugin-pwa (manifest + offline SW)
├─ tsconfig.json
└─ package.json
```

### Core logic

State: `current` (live count) and `record` (best count from any completed round, persisted). The displayed max is `max(record, current)`, so it climbs live as you pass your best.

On each click: increment current. The first time `current` overtakes the round's frozen record-to-beat — and only if a prior record exists (`record > 0`) — fire the glow + flash celebration **once** for that round. Persist.

On reset: show a themed confirmation modal; on confirm, set `record = max(record, current)`, set `current = 0`, clear the round's celebration flag, persist. The next round's record-to-beat is the new `record`.

Progress-to-record indicator: `current / record`, clamped to 100%. With no record yet (`record = 0`), it stays neutral/empty.

Theme: Dark / Light / System, applied via `data-theme` on `<html>`. In System mode, follow `matchMedia('(prefers-color-scheme: dark)')` live.

Wake lock: request a screen wake lock while the app is active; re-acquire on visibility change; release on hide.

### Steps

1. **Init repo** — initialize a git repository in the project directory.
2. **Scaffold** — Vite vanilla-ts + `vite-plugin-pwa` + Vitest; `tsconfig`.
3. **Markup** — `index.html`: max display, current display, progress indicator, large button, reset, 3-way theme control, reset confirmation modal.
4. **Counter module** — current/record state, increment, reset, frozen record-to-beat detection, persistence.
5. **Theme module** — dark/light/system with `matchMedia` listener + persistence.
6. **Feedback module** — pulse on press, celebration on record (CSS-driven).
7. **Input + wake lock** — keyboard handlers (Space/Enter), large tap targets, screen wake lock with visibility handling.
8. **Reset confirmation** — themed in-app modal (Yes/Cancel) before zeroing the count.
9. **Styles** — mobile-first responsive layout, light/dark variables, progress indicator, modal, large touch targets.
10. **Icons** — design `assets/icon.svg`: a stylized letter **K** using the app's theme colors (drawn from the Dark or Light palette); generate 192/512/maskable PNGs (e.g. `@vite-pwa/assets-generator`).
11. **PWA config** — manifest (standalone, theme color, icons) + offline service worker.
12. **Tests** — Vitest unit tests for counter logic (increment, reset, record preservation, one-time record detection) and theme resolution/persistence.
13. **Verify** — `npm run dev` for interactions; `npm test`; `build && preview` + Lighthouse for installability/offline.

### Defaults

- Theme defaults to **System** on first launch.
- Record celebration: glow + flash, fires once per round on the click that beats the frozen record-to-beat; suppressed on the first-ever climb (no prior record).
- Reset uses a themed in-app modal (not the native `confirm()`).
- No count cap.

## Roadmap (v2)

- **Multiple named counters / tabs** — track several things at once; reshapes the data model and UI.
- **Record timestamp** — show when the current max was set.
- **Sound** — optional click/record sounds with a sound toggle (off by default).
- **Animated count transitions** — smooth number changes on increment and reset.
- **PWA shortcuts** — manifest `shortcuts` for quick actions from the installed app icon (e.g. a "Reset" deep link, or per-counter shortcuts once multiple counters exist).
