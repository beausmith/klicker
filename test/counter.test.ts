import { describe, it, expect, beforeEach } from "vitest";
import { CounterStore, loadState, type KeyValueStore } from "../src/counter.ts";

/** In-memory store so each test is isolated. */
function memStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("CounterStore", () => {
  let store: KeyValueStore;

  beforeEach(() => {
    store = memStore();
  });

  it("starts at zero", () => {
    const c = new CounterStore(store);
    expect(c.snapshot).toMatchObject({ current: 0, record: 0, beatTarget: 0 });
  });

  it("increments and tracks the record live", () => {
    const c = new CounterStore(store);
    c.increment();
    c.increment();
    expect(c.snapshot.current).toBe(2);
    expect(c.snapshot.record).toBe(2);
  });

  it("does NOT celebrate on the first-ever climb (no prior record)", () => {
    const c = new CounterStore(store);
    expect(c.increment().newRecord).toBe(false);
    expect(c.increment().newRecord).toBe(false);
    expect(c.increment().newRecord).toBe(false);
  });

  it("preserves the record across a reset", () => {
    const c = new CounterStore(store);
    c.increment(); // 1
    c.increment(); // 2
    c.increment(); // 3
    c.reset();
    expect(c.snapshot.current).toBe(0);
    expect(c.snapshot.record).toBe(3);
    expect(c.snapshot.beatTarget).toBe(3); // next round must beat 3
  });

  it("celebrates exactly once when beating the previous best", () => {
    const c = new CounterStore(store);
    c.increment(); // 1
    c.increment(); // 2
    c.reset(); // record = 2, beatTarget = 2

    expect(c.increment().newRecord).toBe(false); // 1, below best
    expect(c.increment().newRecord).toBe(false); // 2, equals best (not beaten)
    expect(c.increment().newRecord).toBe(true); //  3, beats best -> celebrate
    expect(c.increment().newRecord).toBe(false); // 4, already celebrated
    expect(c.snapshot.record).toBe(4);
  });

  it("resets the celebration flag each round", () => {
    const c = new CounterStore(store);
    c.increment();
    c.reset(); // record = 1

    expect(c.increment().newRecord).toBe(false); // 1 == best
    expect(c.increment().newRecord).toBe(true); //  2 beats best
    c.reset(); // record = 2

    expect(c.increment().newRecord).toBe(false); // 1
    expect(c.increment().newRecord).toBe(false); // 2 == best
    expect(c.increment().newRecord).toBe(true); //  3 beats best again
  });

  it("reports progress toward the record in [0,1]", () => {
    const c = new CounterStore(store);
    expect(c.progress).toBe(0); // no record yet
    c.increment();
    c.increment();
    c.increment();
    c.increment(); // record = 4
    c.reset(); // beatTarget = 4
    c.increment(); // 1 / 4
    expect(c.progress).toBeCloseTo(0.25);
    c.increment(); // 2 / 4
    expect(c.progress).toBeCloseTo(0.5);
  });

  it("persists state and reloads it", () => {
    const a = new CounterStore(store);
    a.increment();
    a.increment();
    a.reset();
    a.increment();

    const reloaded = loadState(store);
    expect(reloaded.current).toBe(1);
    expect(reloaded.record).toBe(2);
    expect(reloaded.beatTarget).toBe(2);
  });

  it("recovers from corrupt storage", () => {
    store.setItem("klicker.counter.v1", "{not json");
    const c = new CounterStore(store);
    expect(c.snapshot).toMatchObject({ current: 0, record: 0 });
  });

  it("sanitizes negative / non-integer persisted values", () => {
    store.setItem(
      "klicker.counter.v1",
      JSON.stringify({ current: -5, record: 3.9, beatTarget: "x" }),
    );
    const s = loadState(store);
    expect(s.current).toBe(0);
    expect(s.record).toBe(3);
    expect(s.beatTarget).toBe(0);
  });
});
