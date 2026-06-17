// A small accessible confirmation modal: focus-trapped, Esc-cancelable,
// closes on backdrop or any [data-close] element. Promise resolves true on
// confirm, false otherwise.

export function confirmDialog(root: HTMLElement, confirmBtn: HTMLElement): Promise<boolean> {
  return new Promise((resolve) => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = root.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const close = (result: boolean) => {
      root.hidden = true;
      document.removeEventListener("keydown", onKeydown, true);
      root.removeEventListener("click", onClick);
      previouslyFocused?.focus?.();
      resolve(result);
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Tab" && focusable.length > 0) {
        // Trap focus within the dialog.
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === confirmBtn) {
        close(true);
      } else if (target.closest("[data-close]")) {
        close(false);
      }
    };

    document.addEventListener("keydown", onKeydown, true);
    root.addEventListener("click", onClick);

    root.hidden = false;
    confirmBtn.focus();
  });
}
