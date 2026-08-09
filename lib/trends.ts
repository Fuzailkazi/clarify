export type TrendInput = {
  name: string;
  count: number;
};

export type Trend = {
  name: string;
  count: number;
  prevCount: number | null;
  delta: number;
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/\band\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Deterministic week-over-week comparison: matches this week's themes to the
 * previous batch's themes by normalized name and computes count deltas.
 * Themes with no match in the previous week are marked as new (prevCount null).
 */
export function buildTrends(current: TrendInput[], previous: TrendInput[] | null): Trend[] {
  if (!previous || previous.length === 0) {
    return current.map((t) => ({ name: t.name, count: t.count, prevCount: null, delta: t.count }));
  }

  const prevByName = new Map(previous.map((t) => [normalize(t.name), t.count]));

  return current
    .map((t) => {
      const prevCount = prevByName.get(normalize(t.name)) ?? null;
      return {
        name: t.name,
        count: t.count,
        prevCount,
        delta: prevCount === null ? t.count : t.count - prevCount,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.count - a.count);
}
