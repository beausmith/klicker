import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadChoice,
  saveChoice,
  resolveTheme,
  ThemeController,
  type ThemeChoice,
} from "../src/theme.ts";
import type { KeyValueStore } from "../src/counter.ts";

function memStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

/** A controllable fake MediaQueryList. */
function fakeMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  return {
    mql: {
      matches,
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    } as unknown as MediaQueryList,
    set(value: boolean) {
      (this.mql as { matches: boolean }).matches = value;
      listeners.forEach((cb) => cb());
    },
  };
}

describe("resolveTheme", () => {
  it("maps explicit choices directly", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("follows the OS preference in system mode", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("choice persistence", () => {
  it("defaults to system when nothing is stored", () => {
    expect(loadChoice(memStore())).toBe("system");
  });

  it("defaults to system on an invalid stored value", () => {
    const store = memStore();
    store.setItem("klicker.theme.v1", "rainbow");
    expect(loadChoice(store)).toBe("system");
  });

  it("round-trips a saved choice", () => {
    const store = memStore();
    for (const choice of ["light", "dark", "system"] as ThemeChoice[]) {
      saveChoice(store, choice);
      expect(loadChoice(store)).toBe(choice);
    }
  });
});

describe("ThemeController", () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement("html");
  });

  it("applies the stored choice on construction", () => {
    const store = memStore();
    saveChoice(store, "dark");
    const { mql } = fakeMedia(false);
    new ThemeController(store, root, mql);
    expect(root.getAttribute("data-theme")).toBe("dark");
  });

  it("updates and persists when the choice changes", () => {
    const store = memStore();
    const { mql } = fakeMedia(false);
    const ctrl = new ThemeController(store, root, mql);
    ctrl.setChoice("dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(loadChoice(store)).toBe("dark");
  });

  it("reacts to OS changes only in system mode", () => {
    const store = memStore();
    const media = fakeMedia(false);
    const ctrl = new ThemeController(store, root, media.mql);
    expect(root.getAttribute("data-theme")).toBe("light"); // system + light OS

    media.set(true); // OS flips to dark
    expect(root.getAttribute("data-theme")).toBe("dark");

    ctrl.setChoice("light"); // pin to light
    media.set(false);
    media.set(true); // OS changes ignored now
    expect(root.getAttribute("data-theme")).toBe("light");
  });

  it("invokes the onChange callback with choice and resolved theme", () => {
    const store = memStore();
    const { mql } = fakeMedia(true);
    const onChange = vi.fn();
    const ctrl = new ThemeController(store, root, mql, onChange);
    expect(onChange).toHaveBeenLastCalledWith("system", "dark");
    ctrl.setChoice("light");
    expect(onChange).toHaveBeenLastCalledWith("light", "light");
  });
});
