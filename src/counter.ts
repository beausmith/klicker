// Counter state + persistence.
//
// Model: `current` is the live count. `record` is your best count ever
// (climbs live as you pass it). `beatTarget` is the record-to-beat frozen at
// the start of each round, so we can fire the celebration exactly once when
// you overtake your previous best. On the very first climb there is no prior
// record (beatTarget === 0), so no celebration fires.

export interface CounterState {
  current: number;
  record: number;
  /** Value to beat this round, frozen at the last round start. */
  beatTarget: number;
  /** Whether the record celebration already fired this round. */
  celebrated: boolean;
}

export interface ClickResult {
  state: CounterState;
  /** True only on the single click that overtakes the previous best. */
  newRecord: boolean;
}

const STORAGE_KEY = "klicker.counter.v1";

/** Minimal storage surface so the store is easy to test. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function clampNonNegativeInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function loadState(store: KeyValueStore): CounterState {
  const raw = store.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<CounterState>;
      const current = clampNonNegativeInt(parsed.current);
      const record = Math.max(clampNonNegativeInt(parsed.record), current);
      const beatTarget = clampNonNegativeInt(parsed.beatTarget);
      return {
        current,
        record,
        beatTarget,
        celebrated: Boolean(parsed.celebrated),
      };
    } catch {
      // fall through to a fresh state on corrupt data
    }
  }
  return { current: 0, record: 0, beatTarget: 0, celebrated: false };
}

export class CounterStore {
  private state: CounterState;

  constructor(private readonly store: KeyValueStore) {
    this.state = loadState(store);
  }

  /** Current snapshot (a copy, so callers can't mutate internal state). */
  get snapshot(): CounterState {
    return { ...this.state };
  }

  /** Progress toward your best, in [0, 1]. Neutral (0) when no record exists. */
  get progress(): number {
    const { current, record } = this.state;
    if (record <= 0) return 0;
    return Math.min(1, current / record);
  }

  increment(): ClickResult {
    const s = this.state;
    s.current += 1;

    let newRecord = false;
    if (s.beatTarget > 0 && !s.celebrated && s.current > s.beatTarget) {
      newRecord = true;
      s.celebrated = true;
    }
    if (s.current > s.record) {
      s.record = s.current;
    }

    this.persist();
    return { state: { ...s }, newRecord };
  }

  reset(): CounterState {
    const s = this.state;
    s.record = Math.max(s.record, s.current);
    s.current = 0;
    s.beatTarget = s.record; // next round, try to beat your best
    s.celebrated = false;
    this.persist();
    return { ...s };
  }

  private persist(): void {
    this.store.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}
