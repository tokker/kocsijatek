import type { FlagSpec } from '../flags/FlagSvg'
import type { Rng } from '../../core/rng'

export interface Focus {
  fx: number
  fy: number
}

/**
 * Hova nagyítsunk rá a zászlón.
 *
 * Nem véletlen pontra: egy találomra választott hely a legnagyobb
 * nagyításnál gyakran egyetlen egyszínű foltra esne, ami nem nehéz
 * feladat, hanem megfejthetetlen — a 100 pontos szint halott súly lenne.
 *
 * Mivel a zászlók specifikációját ismerjük, ki tudjuk számolni, hol
 * futnak a színhatárok, és oda tesszük a fókuszt. Így a legszűkebb
 * kivágásban is mindig két szín találkozik.
 */
export function focusFor(spec: FlagSpec, rng: Rng): Focus {
  /** Sávhatárok 0..1 arányban, a súlyokat is figyelembe véve. */
  const bandBoundaries = (colors: string[], weights?: number[]): number[] => {
    const w = weights ?? colors.map(() => 1)
    const total = w.reduce((sum, value) => sum + value, 0)
    const edges: number[] = []
    let running = 0
    for (let i = 0; i < w.length - 1; i++) {
      running += w[i]
      edges.push(running / total)
    }
    return edges
  }

  /** Véletlen pont a középső sávban, hogy ne a zászló sarkába essen. */
  const along = () => 0.2 + rng.next() * 0.6

  switch (spec.kind) {
    case 'horizontal': {
      const edges = bandBoundaries(spec.colors, spec.weights)
      return { fx: along(), fy: edges[rng.int(edges.length)] }
    }
    case 'vertical': {
      const edges = bandBoundaries(spec.colors, spec.weights)
      return { fx: edges[rng.int(edges.length)], fy: along() }
    }
    case 'nordic': {
      // A függőleges szár a szélesség harmadánál, a vízszintes középen.
      return rng.next() < 0.5
        ? { fx: 1 / 3, fy: along() }
        : { fx: along(), fy: 0.5 }
    }
    case 'swissCross': {
      // A kereszt karjainak széle: 24/60 és 36/60.
      return rng.next() < 0.5
        ? { fx: rng.next() < 0.5 ? 0.4 : 0.6, fy: 0.35 + rng.next() * 0.3 }
        : { fx: 0.35 + rng.next() * 0.3, fy: rng.next() < 0.5 ? 0.4 : 0.6 }
    }
    case 'disc':
    case 'bandsDisc': {
      // Pont a korong kerületén, hogy a görbe íve is látsszon.
      const centreX = spec.kind === 'disc' ? (spec.discX ?? 45) / 90 : 0.5
      const radius = spec.kind === 'disc' ? 17 : 12
      const angle = rng.next() * Math.PI * 2
      return {
        fx: centreX + (radius * Math.cos(angle)) / 90,
        fy: 0.5 + (radius * Math.sin(angle)) / 60,
      }
    }
  }
}
