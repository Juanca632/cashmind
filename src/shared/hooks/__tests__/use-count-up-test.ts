import { countFrame } from '../use-count-up';

describe('The app feels smooth: the running left-to-spend figure (countFrame)', () => {
  const cases: [number, number][] = [
    [160000, 158750],
    [0, 99999],
    [70000, -10000],
    [-10000, 70000],
    [5, 6],
    [-1234567890, 1234567890],
  ];

  it.each(cases)('starts exactly at the old amount (%i -> %i)', (from, to) => {
    expect(countFrame(from, to, 0)).toBe(from);
  });

  it.each(cases)('ends exactly at the new amount, in cents (%i -> %i)', (from, to) => {
    expect(countFrame(from, to, 1)).toBe(to);
  });

  it.each(cases)('shows whole cents in every frame (%i -> %i)', (from, to) => {
    for (let step = 0; step <= 100; step++) {
      expect(Number.isInteger(countFrame(from, to, step / 100))).toBe(true);
    }
  });

  it.each(cases)('moves towards the new amount and never overshoots it (%i -> %i)', (from, to) => {
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    let previousDistance = Math.abs(to - from);
    for (let step = 1; step <= 100; step++) {
      const frame = countFrame(from, to, step / 100);
      expect(frame).toBeGreaterThanOrEqual(low);
      expect(frame).toBeLessThanOrEqual(high);
      const distance = Math.abs(to - frame);
      expect(distance).toBeLessThanOrEqual(previousDistance);
      previousDistance = distance;
    }
  });

  it('leaves the old amount at some point before the end (it is not a jump)', () => {
    const middle = countFrame(0, 100000, 0.5);
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(100000);
  });

  it('with the same amount it stays there', () => {
    expect(countFrame(4200, 4200, 0.5)).toBe(4200);
  });

  it('a progress beyond the end still gives the exact new amount', () => {
    expect(countFrame(100, 5000, 1.7)).toBe(5000);
  });

  it('never shows more digits than the larger of the two amounts', () => {
    for (let step = 0; step <= 100; step++) {
      expect(Math.abs(countFrame(-100, 99999999, step / 100))).toBeLessThanOrEqual(99999999);
      expect(Math.abs(countFrame(500000, -100, step / 100))).toBeLessThanOrEqual(500000);
    }
  });
});
