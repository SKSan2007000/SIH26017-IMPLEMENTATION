/**
 * Deterministic (seeded) helpers for generating bulk FICTIONAL demo data.
 * Using a seeded generator instead of Math.random() keeps the mock dataset
 * stable across server/client renders (important for Next.js hydration)
 * and across reloads, without hand-writing 50+ literal parcel records.
 */

export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

export function jitterCoord([lon, lat]: [number, number], rng: () => number, spread = 0.05): [number, number] {
  return [lon + (rng() - 0.5) * spread, lat + (rng() - 0.5) * spread * 0.8];
}

export const STATES_DISTRICTS: Record<string, string[]> = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
  Maharashtra: ['Pune', 'Nagpur', 'Nashik'],
  Gujarat: ['Ahmedabad', 'Surat'],
  Karnataka: ['Bengaluru Rural', 'Mysuru'],
};

export const DISTRICT_COORDS: Record<string, [number, number]> = {
  Chennai: [80.237, 13.087],
  Coimbatore: [76.981, 11.017],
  Madurai: [78.119, 9.925],
  Tiruchirappalli: [78.686, 10.79],
  Pune: [73.856, 18.52],
  Nagpur: [79.088, 21.146],
  Nashik: [73.789, 19.997],
  Ahmedabad: [72.571, 23.023],
  Surat: [72.831, 21.17],
  'Bengaluru Rural': [77.594, 13.199],
  Mysuru: [76.639, 12.297],
};
