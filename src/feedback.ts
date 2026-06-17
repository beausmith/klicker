// Visual feedback. Haptics aren't reliable on iOS PWAs, so feedback is purely
// visual: a subtle pulse on any button press, and a prominent glow + flash when
// the count overtakes your best. Respects prefers-reduced-motion.

const reducedMotion =
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Re-trigger a CSS animation class even if it's applied back-to-back. */
function retrigger(el: HTMLElement, className: string): void {
  el.classList.remove(className);
  // Force reflow so removing + re-adding restarts the animation.
  void el.offsetWidth;
  el.classList.add(className);
}

/** Subtle pulse on press. */
export function pulse(el: HTMLElement): void {
  if (reducedMotion) return;
  retrigger(el, "is-pulsing");
}

/**
 * Celebrate a new record: flash the count and glow the screen.
 * `screen` is the app container that gets the glow overlay.
 */
export function celebrate(countEl: HTMLElement, screen: HTMLElement): void {
  if (reducedMotion) {
    // Keep an accessible, motion-free acknowledgement.
    flashOnce(screen, "is-record-static");
    return;
  }
  retrigger(countEl, "is-celebrating");
  retrigger(screen, "is-record");
}

function flashOnce(el: HTMLElement, className: string): void {
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), 600);
}
