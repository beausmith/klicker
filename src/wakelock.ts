// Screen wake lock: keep the display awake while counting. The lock is
// released by the browser when the page is hidden, so we re-acquire it when
// the page becomes visible again. Gracefully no-ops where unsupported.

export class WakeLock {
  private sentinel: WakeLockSentinel | null = null;
  private wanted = false;

  constructor() {
    document.addEventListener("visibilitychange", () => {
      if (this.wanted && document.visibilityState === "visible") {
        void this.acquire();
      }
    });
  }

  get supported(): boolean {
    return "wakeLock" in navigator;
  }

  async enable(): Promise<void> {
    this.wanted = true;
    await this.acquire();
  }

  async disable(): Promise<void> {
    this.wanted = false;
    try {
      await this.sentinel?.release();
    } catch {
      // ignore
    }
    this.sentinel = null;
  }

  private async acquire(): Promise<void> {
    if (!this.supported || this.sentinel) return;
    try {
      this.sentinel = await navigator.wakeLock.request("screen");
      this.sentinel.addEventListener("release", () => {
        this.sentinel = null;
      });
    } catch {
      // Permission denied / not allowed (e.g. low battery) — silently degrade.
    }
  }
}
