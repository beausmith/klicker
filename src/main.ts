import "./styles.css";
import { CounterStore } from "./counter.ts";
import { ThemeController, type ThemeChoice } from "./theme.ts";
import { celebrate, pulse } from "./feedback.ts";
import { WakeLock } from "./wakelock.ts";
import { confirmDialog } from "./modal.ts";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const app = document.querySelector<HTMLElement>(".app")!;
const countEl = byId<HTMLOutputElement>("count");
const recordEl = byId<HTMLOutputElement>("record");
const progressEl = document.querySelector<HTMLElement>(".progress")!;
const progressFill = byId<HTMLElement>("progress-fill");
const clickBtn = byId<HTMLButtonElement>("click");
const resetBtn = byId<HTMLButtonElement>("reset");
const themeToggle = document.querySelector<HTMLElement>(".theme-toggle")!;
const resetDialog = byId<HTMLElement>("reset-dialog");
const resetConfirmBtn = byId<HTMLButtonElement>("reset-confirm");

const numberFmt = new Intl.NumberFormat();

// --- State ---------------------------------------------------------------
const counter = new CounterStore(localStorage);

function render(): void {
  const { current, record } = counter.snapshot;
  countEl.textContent = numberFmt.format(current);
  recordEl.textContent = numberFmt.format(record);
  const pct = Math.round(counter.progress * 100);
  progressFill.style.width = `${pct}%`;
  progressEl.setAttribute("aria-valuenow", String(pct));
}

// --- Theme ---------------------------------------------------------------
const themeButtons = Array.from(
  themeToggle.querySelectorAll<HTMLButtonElement>("[data-theme-choice]"),
);

function reflectThemeChoice(choice: ThemeChoice): void {
  for (const btn of themeButtons) {
    const selected = btn.dataset.themeChoice === choice;
    btn.setAttribute("aria-checked", String(selected));
    btn.classList.toggle("is-active", selected);
  }
}

const theme = new ThemeController(
  localStorage,
  document.documentElement,
  matchMedia("(prefers-color-scheme: dark)"),
  (choice) => reflectThemeChoice(choice),
);

for (const btn of themeButtons) {
  btn.addEventListener("click", () => {
    theme.setChoice(btn.dataset.themeChoice as ThemeChoice);
  });
}
reflectThemeChoice(theme.currentChoice);

// --- Wake lock -----------------------------------------------------------
const wakeLock = new WakeLock();
void wakeLock.enable();

// --- Counting ------------------------------------------------------------
function doIncrement(): void {
  const { newRecord } = counter.increment();
  render();
  pulse(clickBtn);
  if (newRecord) celebrate(countEl, app);
}

clickBtn.addEventListener("click", doIncrement);

// Space / Enter increment when the big button isn't focused; when it is, the
// browser already fires a click, so avoid double counting.
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (e.key !== " " && e.key !== "Enter") return;
  if (!resetDialog.hidden) return; // modal open: let the dialog handle keys
  const active = document.activeElement;
  if (active instanceof HTMLButtonElement) return; // a focused button handles its own activation
  e.preventDefault();
  doIncrement();
});

// --- Reset ---------------------------------------------------------------
resetBtn.addEventListener("click", async () => {
  const confirmed = await confirmDialog(resetDialog, resetConfirmBtn);
  if (confirmed) {
    counter.reset();
    pulse(resetBtn);
    render();
  }
});

// --- Init ----------------------------------------------------------------
render();
