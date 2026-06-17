// Theme: Dark / Light / System. The user's choice is persisted; "system"
// follows the OS color-scheme live via matchMedia. The resolved theme is
// applied as `data-theme` on the document root.

import type { KeyValueStore } from "./counter.ts";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "klicker.theme.v1";
const CHOICES: readonly ThemeChoice[] = ["light", "dark", "system"];

export function loadChoice(store: KeyValueStore): ThemeChoice {
  const raw = store.getItem(STORAGE_KEY);
  return (CHOICES as readonly string[]).includes(raw ?? "")
    ? (raw as ThemeChoice)
    : "system";
}

export function saveChoice(store: KeyValueStore, choice: ThemeChoice): void {
  store.setItem(STORAGE_KEY, choice);
}

/** Resolve a choice to a concrete theme given the OS preference. */
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ResolvedTheme {
  if (choice === "system") return prefersDark ? "dark" : "light";
  return choice;
}

export class ThemeController {
  private choice: ThemeChoice;

  constructor(
    private readonly store: KeyValueStore,
    private readonly root: HTMLElement,
    private readonly media: MediaQueryList,
    private readonly onChange?: (choice: ThemeChoice, resolved: ResolvedTheme) => void,
  ) {
    this.choice = loadChoice(store);
    this.media.addEventListener("change", () => {
      // Only re-resolve when following the system.
      if (this.choice === "system") this.apply();
    });
    this.apply();
  }

  get currentChoice(): ThemeChoice {
    return this.choice;
  }

  setChoice(choice: ThemeChoice): void {
    this.choice = choice;
    saveChoice(this.store, choice);
    this.apply();
  }

  private apply(): void {
    const resolved = resolveTheme(this.choice, this.media.matches);
    this.root.setAttribute("data-theme", resolved);
    this.onChange?.(this.choice, resolved);
  }
}
