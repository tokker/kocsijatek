export interface Rng {
  /** Következő szám a [0, 1) tartományból. */
  next(): number
  /** Egész szám a [0, max) tartományból. */
  int(max: number): number
  /** Új, megkevert tömb. Az eredetit nem módosítja. */
  shuffle<T>(items: readonly T[]): T[]
  /** n darab különböző elem, determinisztikus sorrendben. */
  pick<T>(items: readonly T[], n: number): T[]
}

/**
 * xmur3 string hash — a seed stringet 32 bites egésszé alakítja,
 * mert a mulberry32 numerikus magot vár.
 */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

/** mulberry32 — gyors, jó eloszlású 32 bites álvéletlen generátor. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Ez a függvény felel azért, hogy minden csapat pontosan ugyanazt a
 * feladatsort kapja. Ha két autó eltérő kérdéseket kapna, a pontszámaik
 * összehasonlíthatatlanná válnának — az egész verseny értelmét vesztené.
 */
export function createRng(seed: string): Rng {
  const next = mulberry32(xmur3(seed)())

  const rng: Rng = {
    next,
    int: (max) => Math.floor(next() * max),
    shuffle: (items) => {
      const out = [...items]
      // Fisher-Yates, hátulról előre
      for (let i = out.length - 1; i > 0; i--) {
        const j = rng.int(i + 1)
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    pick: (items, n) => rng.shuffle(items).slice(0, n),
  }

  return rng
}
