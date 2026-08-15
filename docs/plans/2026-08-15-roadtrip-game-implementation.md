# Road Trip Game — implementációs terv

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Telefonról használható PWA, ahol 2+ autó csapatként versenyez 15 perces körökben, minden csapat a saját tempójában indítja a kört, de senki nem léphet tovább, amíg mindenki be nem fejezte az előzőt.

**Architecture:** Statikus React PWA, minden játéktartalommal a bundle-ben. A hálózat csak a csapatállapotot mozgatja (~1 KB/kör) egy `SyncAdapter` interfészen keresztül, aminek két implementációja van: `MockAdapter` (localStorage + BroadcastChannel, fejlesztéshez) és `FirebaseAdapter` (élesben). A játékok önálló modulok egy közös `GameModule` interfész mögött, determinisztikus seed-ből építik a feladatsort, hogy minden csapat ugyanazt kapja.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Vitest + Testing Library, Firebase Realtime Database, vite-plugin-pwa, Cloudflare Pages.

**Tervdokumentum:** `docs/plans/2026-08-15-roadtrip-game-design.md`

---

## Fázisok

| Fázis | Tartalom | Taskok |
|---|---|---|
| 0 | Váz és eszközök | 1–4 |
| 1 | Tiszta domain logika (TDD-mag) | 5–9 |
| 2 | Szinkron réteg | 10–13 |
| 3 | Játékmodul-keretrendszer | 14–16 |
| 4 | A tíz játék | 17–26 |
| 5 | Képernyők | 27–31 |
| 6 | i18n | 32 |
| 7 | Fejlesztői eszközök | 33 |
| 8 | Tartalomfeltöltés és deploy | 34–36 |

**Fontos:** az 1. fázis végén már futtatható tesztekkel bizonyított a kör-kapu logika, a 2. fázis végén két böngészőfül már szinkronban van, a 4. fázis első játéka után pedig **teljes kör végigjátszható**. Az első valódi próbád a 18. task után lehet.

---

# Fázis 0 — Váz és eszközök

### Task 1: Vite projekt inicializálása

**Files:**
- Create: a projekt gyökere (`package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html`, `src/`)

**Step 1: Scaffold**

Futtasd a projekt gyökerében (`C:\Users\bunda\Desktop\kocsijatek`). A `.` miatt a meglévő `docs/` és `.git/` megmarad:

```bash
npm create vite@latest . -- --template react-ts
```

Ha rákérdez, hogy a könyvtár nem üres, válaszd az **"Ignore files and continue"** opciót — a `docs/`, `.git/` és `.gitignore` érintetlen marad.

**Step 2: Függőségek telepítése**

```bash
npm install
```

**Step 3: Ellenőrzés**

```bash
npm run build
```

Elvárt: sikeres build, létrejön a `dist/`.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript project"
```

---

### Task 2: Vitest beállítása

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/sanity.test.ts`

**Step 1: Teszt-függőségek**

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

**Step 2: `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Step 3: `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

**Step 4: `package.json` scriptek** — add hozzá a `scripts` blokkhoz:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Írj egy elbukó sanity tesztet — `src/test/sanity.test.ts`**

```ts
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Step 6: Futtasd**

```bash
npm test
```

Elvárt: `1 passed`.

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: configure Vitest with jsdom and Testing Library"
```

---

### Task 3: Tailwind CSS 4

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/index.css`
- Delete: `src/App.css`

**Step 1: Telepítés**

```bash
npm install tailwindcss @tailwindcss/vite
```

**Step 2: `vite.config.ts`** — vedd fel a plugint:

```ts
import tailwindcss from '@tailwindcss/vite'
// plugins: [react(), tailwindcss()],
```

**Step 3: `src/index.css` teljes tartalma**

```css
@import "tailwindcss";

@theme {
  --color-car-1: #ef4444;
  --color-car-2: #3b82f6;
  --color-car-3: #22c55e;
  --color-car-4: #eab308;
}

html, body, #root {
  height: 100%;
}

body {
  /* Autóban rázkódik a telefon: nagy célfelületek, semmi szövegkijelölés */
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: none;
}

/* Beviteli mezőkben viszont kell a kijelölés */
input, textarea {
  -webkit-user-select: text;
  user-select: text;
}
```

**Step 4:** Töröld a `src/App.css`-t és az importját az `src/App.tsx`-ből.

**Step 5: Ellenőrzés**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: set up Tailwind CSS 4 with team color tokens"
```

---

### Task 4: PWA plugin

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icon-192.png`, `public/icon-512.png` (egyszerű, tömör színű ikonok elég)

**Step 1: Telepítés**

```bash
npm install -D vite-plugin-pwa
```

**Step 2: `vite.config.ts`** — plugin konfiguráció:

```ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icon-192.png', 'icon-512.png'],
  manifest: {
    name: 'Road Trip Game',
    short_name: 'RoadTrip',
    description: 'Team vs team games for long car journeys',
    theme_color: '#0f172a',
    background_color: '#0f172a',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // A teljes játéktartalom cache-elve: alagútban is fut
    globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
  },
})
```

**Step 3: Ellenőrzés**

```bash
npm run build
```

Elvárt: a `dist/` tartalmaz `sw.js` és `manifest.webmanifest` fájlt.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest and offline service worker"
```

---

# Fázis 1 — Tiszta domain logika

Ez a fázis **színtiszta TypeScript, React nélkül**. Minden itt születő függvény determinisztikus és unit-tesztelhető. Ez a projekt gerince — ha ez helyes, a többi már csak felület.

### Task 5: Determinisztikus véletlengenerátor

Ez a fájl felel azért, hogy **mindkét autó ugyanazt a feladatsort kapja**. Ha ez elromlik, a pontszámok összehasonlíthatatlanná válnak.

**Files:**
- Create: `src/core/rng.ts`
- Test: `src/core/rng.test.ts`

**Step 1: Írd meg az elbukó tesztet — `src/core/rng.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = createRng('ROOM7-round3')
    const b = createRng('ROOM7-round3')
    const seqA = [a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next()]
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = createRng('ROOM7-round3')
    const b = createRng('ROOM7-round4')
    expect(a.next()).not.toBe(b.next())
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng('x')
    for (let i = 0; i < 500; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int(n) stays within bounds', () => {
    const rng = createRng('y')
    for (let i = 0; i < 500; i++) {
      const v = rng.int(6)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(6)
    }
  })

  it('shuffle is deterministic and preserves all elements', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const a = createRng('s').shuffle(input)
    const b = createRng('s').shuffle(input)
    expect(a).toEqual(b)
    expect([...a].sort((x, y) => x - y)).toEqual(input)
  })

  it('shuffle does not mutate the input array', () => {
    const input = [1, 2, 3]
    createRng('s').shuffle(input)
    expect(input).toEqual([1, 2, 3])
  })

  it('pick returns n distinct elements deterministically', () => {
    const pool = Array.from({ length: 50 }, (_, i) => i)
    const a = createRng('p').pick(pool, 10)
    const b = createRng('p').pick(pool, 10)
    expect(a).toEqual(b)
    expect(new Set(a).size).toBe(10)
  })
})
```

**Step 2: Futtasd — elvárt: FAIL** (`Cannot find module './rng'`)

```bash
npx vitest run src/core/rng.test.ts
```

**Step 3: Implementáció — `src/core/rng.ts`**

```ts
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
 * xmur3 string hash — a seed stringet 32 bites egésszé alakítja.
 * Azért kell, mert a mulberry32 numerikus magot vár.
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

/** mulberry32 — gyors, jó minőségű 32 bites PRNG. */
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
```

**Step 4: Futtasd — elvárt: 7 passed**

```bash
npx vitest run src/core/rng.test.ts
```

**Step 5: Commit**

```bash
git add src/core/rng.ts src/core/rng.test.ts
git commit -m "feat: add deterministic seeded RNG so all teams get identical items"
```

---

### Task 6: Domain típusok

**Files:**
- Create: `src/core/types.ts`

Ez a task nem tartalmaz tesztet — csak típusdefiníciók, futásidejű viselkedés nélkül.

**Step 1: `src/core/types.ts`**

```ts
export type TeamId = string

export interface TeamInfo {
  id: TeamId
  name: string
  emoji: string
  colorIndex: number
  /** Melyik körnél csatlakozott. A kör-kapu csak az ekkor már bent lévőket várja meg. */
  joinedAtRound: number
}

export interface ScheduleEntry {
  round: number
  gameId: string
  seed: string
}

export interface RoomMeta {
  roomCode: string
  roundSeconds: number
  createdAt: number
  schedule: ScheduleEntry[]
}

export interface GameResult {
  /** 0–1000-re normalizálva, hogy a játéktípusok összemérhetők legyenek. */
  points: number
  /** A játék saját mértéke, megjelenítéshez. Pl. "23 / 30". */
  rawScore: string
  /** Feladatonkénti helyes/helytelen — ez táplálja az összehasonlító rácsot. */
  items: boolean[]
  /** Mennyi időt használt fel a csapat, ezredmásodpercben. */
  timeMs: number
  /** Játékspecifikus extra, pl. a Letter Blitz beírt szavai az egyediség-bónuszhoz. */
  payload?: Record<string, unknown>
}

export interface RoundState {
  started?: Record<TeamId, number>
  done?: Record<TeamId, GameResult>
}

export interface RoomState {
  meta: RoomMeta
  teams: Record<TeamId, TeamInfo>
  rounds: Record<number, RoundState>
}
```

**Step 2: Ellenőrzés**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: define room, team, and game result domain types"
```

---

### Task 7: A kör-kapu logikája

**Ez a projekt legfontosabb függvénye.** Ő dönti el, hogy egy csapat továbbléphet-e. Több teszt jut rá, mint bármi másra.

**Files:**
- Create: `src/core/roundGate.ts`
- Test: `src/core/roundGate.test.ts`

**Step 1: Írd meg az elbukó tesztet — `src/core/roundGate.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { isRoundUnlocked, participatingTeams, teamRoundStatus } from './roundGate'
import type { GameResult, RoomState } from './types'

const result = (points: number): GameResult => ({
  points, rawScore: `${points}`, items: [], timeMs: 1000,
})

function room(over: Partial<RoomState> = {}): RoomState {
  return {
    meta: { roomCode: 'ABC1', roundSeconds: 900, createdAt: 0, schedule: [] },
    teams: {
      car1: { id: 'car1', name: 'Car 1', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
      car2: { id: 'car2', name: 'Car 2', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 },
    },
    rounds: {},
    ...over,
  }
}

describe('isRoundUnlocked', () => {
  it('always unlocks round 1', () => {
    expect(isRoundUnlocked(room(), 1)).toBe(true)
  })

  it('keeps round 2 locked when nobody has finished round 1', () => {
    expect(isRoundUnlocked(room(), 2)).toBe(false)
  })

  it('keeps round 2 locked when only one team has finished round 1', () => {
    const state = room({ rounds: { 1: { done: { car1: result(500) } } } })
    expect(isRoundUnlocked(state, 2)).toBe(false)
  })

  it('unlocks round 2 once every team has finished round 1', () => {
    const state = room({ rounds: { 1: { done: { car1: result(500), car2: result(400) } } } })
    expect(isRoundUnlocked(state, 2)).toBe(true)
  })

  it('does not care that one team started much later', () => {
    const state = room({
      rounds: { 1: { started: { car1: 0, car2: 9_000_000 }, done: { car1: result(1), car2: result(2) } } },
    })
    expect(isRoundUnlocked(state, 2)).toBe(true)
  })

  it('works with four teams', () => {
    const state = room({
      teams: {
        car1: { id: 'car1', name: 'A', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
        car2: { id: 'car2', name: 'B', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 },
        car3: { id: 'car3', name: 'C', emoji: '🚐', colorIndex: 2, joinedAtRound: 1 },
        car4: { id: 'car4', name: 'D', emoji: '🚕', colorIndex: 3, joinedAtRound: 1 },
      },
      rounds: { 1: { done: { car1: result(1), car2: result(1), car3: result(1) } } },
    })
    expect(isRoundUnlocked(state, 2)).toBe(false)
  })

  it('does not deadlock when a team joins mid-game', () => {
    // A car3 a 3. körnél szállt be, tehát az 1. és 2. körre nem kell megvárni.
    const state = room({
      teams: {
        car1: { id: 'car1', name: 'A', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
        car2: { id: 'car2', name: 'B', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 },
        car3: { id: 'car3', name: 'C', emoji: '🚐', colorIndex: 2, joinedAtRound: 3 },
      },
      rounds: { 2: { done: { car1: result(1), car2: result(1) } } },
    })
    expect(isRoundUnlocked(state, 3)).toBe(true)
  })

  it('locks when there are no teams at all', () => {
    expect(isRoundUnlocked(room({ teams: {} }), 2)).toBe(false)
  })
})

describe('participatingTeams', () => {
  it('excludes teams that had not joined yet', () => {
    const state = room({
      teams: {
        car1: { id: 'car1', name: 'A', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
        car3: { id: 'car3', name: 'C', emoji: '🚐', colorIndex: 2, joinedAtRound: 5 },
      },
    })
    expect(participatingTeams(state, 2).map(t => t.id)).toEqual(['car1'])
  })
})

describe('teamRoundStatus', () => {
  it('reports not-started, playing, and done', () => {
    const state = room({
      rounds: { 1: { started: { car2: 1000 }, done: { car1: result(5) } } },
    })
    expect(teamRoundStatus(state, 1, 'car1')).toBe('done')
    expect(teamRoundStatus(state, 1, 'car2')).toBe('playing')
    expect(teamRoundStatus(state, 1, 'car3')).toBe('not-started')
  })

  it('reports done even if the start timestamp is missing', () => {
    const state = room({ rounds: { 1: { done: { car1: result(5) } } } })
    expect(teamRoundStatus(state, 1, 'car1')).toBe('done')
  })
})
```

**Step 2: Futtasd — elvárt: FAIL**

```bash
npx vitest run src/core/roundGate.test.ts
```

**Step 3: Implementáció — `src/core/roundGate.ts`**

```ts
import type { RoomState, TeamId, TeamInfo } from './types'

export type TeamRoundStatus = 'not-started' | 'playing' | 'done'

/**
 * Azok a csapatok, akiknek egy adott körben játszaniuk kell.
 * Aki később szállt be, arra nem várunk a korábbi köröknél — enélkül
 * egy menet közben csatlakozó autó örökre megakasztaná a játékot.
 */
export function participatingTeams(state: RoomState, round: number): TeamInfo[] {
  return Object.values(state.teams ?? {}).filter((t) => t.joinedAtRound <= round)
}

/**
 * A rendszer központi szabálya: az N. kör csak akkor nyílik ki,
 * ha az (N-1). körben MINDEN érintett csapat végzett.
 *
 * Az, hogy ki mikor KEZDTE a kört, teljesen közömbös — pont ez teszi
 * lehetővé, hogy az egyik autó megálljon pihenni, és később kezdjen.
 */
export function isRoundUnlocked(state: RoomState, round: number): boolean {
  if (round <= 1) return true

  const previous = round - 1
  const teams = participatingTeams(state, previous)
  if (teams.length === 0) return false

  const done = state.rounds?.[previous]?.done ?? {}
  return teams.every((team) => done[team.id] != null)
}

export function teamRoundStatus(state: RoomState, round: number, teamId: TeamId): TeamRoundStatus {
  const roundState = state.rounds?.[round]
  if (roundState?.done?.[teamId] != null) return 'done'
  if (roundState?.started?.[teamId] != null) return 'playing'
  return 'not-started'
}

/** Kikre várunk még — ezt írja ki a várakozó képernyő. */
export function teamsStillPlaying(state: RoomState, round: number): TeamInfo[] {
  return participatingTeams(state, round).filter(
    (team) => teamRoundStatus(state, round, team.id) !== 'done',
  )
}
```

**Step 4: Futtasd — elvárt: 11 passed**

**Step 5: Commit**

```bash
git add src/core/roundGate.ts src/core/roundGate.test.ts
git commit -m "feat: add round gate that blocks progress until every team finishes"
```

---

### Task 8: Pontozás és állás

**Files:**
- Create: `src/core/scoring.ts`
- Test: `src/core/scoring.test.ts`

**Step 1: Teszt — `src/core/scoring.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { WINNER_BONUS, normalize, proximityPoints, roundWinners, standings } from './scoring'
import type { GameResult, RoomState } from './types'

const result = (points: number): GameResult => ({
  points, rawScore: `${points}`, items: [], timeMs: 0,
})

describe('normalize', () => {
  it('maps a perfect score to 1000', () => {
    expect(normalize(30, 30)).toBe(1000)
  })
  it('maps zero to zero', () => {
    expect(normalize(0, 30)).toBe(0)
  })
  it('rounds to the nearest integer', () => {
    expect(normalize(1, 3)).toBe(333)
  })
  it('never exceeds 1000 even if earned is above max', () => {
    expect(normalize(40, 30)).toBe(1000)
  })
  it('never goes below zero', () => {
    expect(normalize(-5, 30)).toBe(0)
  })
  it('returns 0 when max is 0 instead of NaN', () => {
    expect(normalize(0, 0)).toBe(0)
  })
})

describe('proximityPoints', () => {
  it('gives full points for an exact guess', () => {
    expect(proximityPoints(100, 100)).toBe(100)
  })
  it('gives zero when the guess is off by the actual value or more', () => {
    expect(proximityPoints(0, 100)).toBe(0)
    expect(proximityPoints(500, 100)).toBe(0)
  })
  it('gives partial points for a close guess', () => {
    expect(proximityPoints(90, 100)).toBe(90)
  })
  it('handles an actual value of zero without dividing by zero', () => {
    expect(proximityPoints(0, 0)).toBe(100)
    expect(proximityPoints(5, 0)).toBe(0)
  })
})

describe('roundWinners', () => {
  it('returns the single highest scoring team', () => {
    const done = { car1: result(700), car2: result(500) }
    expect(roundWinners(done)).toEqual(['car1'])
  })
  it('returns every team on a tie', () => {
    const done = { car1: result(700), car2: result(700) }
    expect(roundWinners(done).sort()).toEqual(['car1', 'car2'])
  })
  it('returns an empty array when nobody finished', () => {
    expect(roundWinners({})).toEqual([])
  })
})

describe('standings', () => {
  const state: RoomState = {
    meta: { roomCode: 'A', roundSeconds: 900, createdAt: 0, schedule: [] },
    teams: {
      car1: { id: 'car1', name: 'A', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 },
      car2: { id: 'car2', name: 'B', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 },
    },
    rounds: {
      1: { done: { car1: result(700), car2: result(500) } },
      2: { done: { car1: result(300), car2: result(900) } },
    },
  }

  it('adds the winner bonus to each round winner', () => {
    const table = standings(state)
    // car1: 700 + 200 (nyert) + 300 = 1200
    // car2: 500 + 900 + 200 (nyert) = 1600
    expect(table.find(r => r.teamId === 'car1')!.total).toBe(700 + WINNER_BONUS + 300)
    expect(table.find(r => r.teamId === 'car2')!.total).toBe(500 + 900 + WINNER_BONUS)
  })

  it('sorts by total descending', () => {
    expect(standings(state).map(r => r.teamId)).toEqual(['car2', 'car1'])
  })

  it('ignores rounds that are not finished by everyone', () => {
    const partial: RoomState = { ...state, rounds: { ...state.rounds, 3: { done: { car1: result(999) } } } }
    const table = standings(partial)
    // A 3. kör nincs lezárva, ezért nem számít bele.
    expect(table.find(r => r.teamId === 'car1')!.total).toBe(700 + WINNER_BONUS + 300)
  })
})
```

**Step 2: Futtasd — elvárt: FAIL**

**Step 3: Implementáció — `src/core/scoring.ts`**

```ts
import { participatingTeams } from './roundGate'
import type { GameResult, RoomState, TeamId } from './types'

export const MAX_POINTS = 1000
export const WINNER_BONUS = 200

/** Bármely játék saját pontszámát a közös 0–1000 skálára hozza. */
export function normalize(earned: number, max: number): number {
  if (max <= 0) return 0
  const ratio = Math.min(1, Math.max(0, earned / max))
  return Math.round(ratio * MAX_POINTS)
}

/**
 * Tippversenyekhez: 100 pont a pontos találatért, onnan lineárisan nullára,
 * amikor a tévedés eléri a valós érték nagyságát.
 */
export function proximityPoints(guess: number, actual: number): number {
  const error = Math.abs(guess - actual)
  if (actual === 0) return error === 0 ? 100 : 0
  const ratio = 1 - error / Math.abs(actual)
  return Math.round(Math.max(0, ratio) * 100)
}

export function roundWinners(done: Record<TeamId, GameResult>): TeamId[] {
  const entries = Object.entries(done)
  if (entries.length === 0) return []
  const best = Math.max(...entries.map(([, r]) => r.points))
  return entries.filter(([, r]) => r.points === best).map(([id]) => id)
}

export interface StandingRow {
  teamId: TeamId
  total: number
  roundsWon: number
  roundsPlayed: number
}

export function standings(state: RoomState): StandingRow[] {
  const rows = new Map<TeamId, StandingRow>()
  for (const team of Object.values(state.teams ?? {})) {
    rows.set(team.id, { teamId: team.id, total: 0, roundsWon: 0, roundsPlayed: 0 })
  }

  for (const [key, round] of Object.entries(state.rounds ?? {})) {
    const roundNumber = Number(key)
    const done = round.done ?? {}
    const expected = participatingTeams(state, roundNumber)
    // Csak a mindenki által lezárt köröket számoljuk — így nem villog az
    // állás, amíg a másik autó még játszik.
    if (expected.length === 0 || !expected.every((t) => done[t.id] != null)) continue

    const winners = new Set(roundWinners(done))
    for (const [teamId, result] of Object.entries(done)) {
      const row = rows.get(teamId)
      if (!row) continue
      row.total += result.points + (winners.has(teamId) ? WINNER_BONUS : 0)
      row.roundsPlayed += 1
      if (winners.has(teamId)) row.roundsWon += 1
    }
  }

  return [...rows.values()].sort((a, b) => b.total - a.total)
}
```

**Step 4: Futtasd — elvárt: 16 passed**

**Step 5: Commit**

```bash
git add src/core/scoring.ts src/core/scoring.test.ts
git commit -m "feat: add score normalization, proximity scoring, and standings"
```

---

### Task 9: Szobakód és menetrend

**Files:**
- Create: `src/core/room.ts`
- Test: `src/core/room.test.ts`

**Step 1: Teszt — `src/core/room.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { buildSchedule, generateRoomCode, isValidRoomCode } from './room'

describe('generateRoomCode', () => {
  it('returns four characters', () => {
    expect(generateRoomCode()).toHaveLength(4)
  })
  it('avoids characters that are easy to misread aloud', () => {
    for (let i = 0; i < 300; i++) {
      expect(generateRoomCode()).not.toMatch(/[OI01]/)
    }
  })
  it('is uppercase alphanumeric', () => {
    expect(generateRoomCode()).toMatch(/^[A-Z2-9]{4}$/)
  })
})

describe('isValidRoomCode', () => {
  it('accepts a well formed code', () => {
    expect(isValidRoomCode('AB2C')).toBe(true)
  })
  it('accepts lowercase input by normalising it', () => {
    expect(isValidRoomCode('ab2c')).toBe(true)
  })
  it('rejects the wrong length', () => {
    expect(isValidRoomCode('AB2')).toBe(false)
  })
  it('rejects ambiguous characters', () => {
    expect(isValidRoomCode('AB0C')).toBe(false)
  })
})

describe('buildSchedule', () => {
  it('creates the requested number of rounds', () => {
    expect(buildSchedule('AB2C', ['a', 'b', 'c'], 10)).toHaveLength(10)
  })

  it('numbers rounds from 1', () => {
    const schedule = buildSchedule('AB2C', ['a', 'b'], 4)
    expect(schedule.map(s => s.round)).toEqual([1, 2, 3, 4])
  })

  it('never repeats a game until every game has been played once', () => {
    const games = ['a', 'b', 'c', 'd']
    const first = buildSchedule('AB2C', games, 4).map(s => s.gameId)
    expect(new Set(first).size).toBe(4)
  })

  it('is deterministic for the same room code', () => {
    const a = buildSchedule('AB2C', ['a', 'b', 'c'], 9)
    const b = buildSchedule('AB2C', ['a', 'b', 'c'], 9)
    expect(a).toEqual(b)
  })

  it('differs between room codes', () => {
    const a = buildSchedule('AB2C', ['a', 'b', 'c', 'd'], 4).map(s => s.gameId)
    const b = buildSchedule('ZZ9X', ['a', 'b', 'c', 'd'], 4).map(s => s.gameId)
    expect(a).not.toEqual(b)
  })

  it('gives every round a distinct seed', () => {
    const seeds = buildSchedule('AB2C', ['a', 'b'], 8).map(s => s.seed)
    expect(new Set(seeds).size).toBe(8)
  })

  it('throws when there are no games', () => {
    expect(() => buildSchedule('AB2C', [], 4)).toThrow()
  })
})
```

**Step 2: Futtasd — elvárt: FAIL**

**Step 3: Implementáció — `src/core/room.ts`**

```ts
import { createRng } from './rng'
import type { ScheduleEntry } from './types'

/**
 * Az O, I, 0 és 1 kimarad: a szobakódot telefonon fogják bediktálni
 * a másik autónak, és ezek hallás után összekeverhetők.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4

export function generateRoomCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isValidRoomCode(input: string): boolean {
  const code = normalizeRoomCode(input)
  if (code.length !== CODE_LENGTH) return false
  return [...code].every((c) => CODE_ALPHABET.includes(c))
}

/**
 * Végigjátssza az összes játékot, mielőtt bármelyiket megismételné.
 * Egy 12 órás úton ez azt jelenti, hogy nem kapod ugyanazt kétszer,
 * amíg a többit ki nem próbáltátok.
 */
export function buildSchedule(
  roomCode: string,
  gameIds: readonly string[],
  roundCount: number,
): ScheduleEntry[] {
  if (gameIds.length === 0) throw new Error('buildSchedule needs at least one game')

  const schedule: ScheduleEntry[] = []
  let pool: string[] = []
  let cycle = 0

  for (let round = 1; round <= roundCount; round++) {
    if (pool.length === 0) {
      pool = createRng(`${roomCode}-cycle${cycle++}`).shuffle(gameIds)
    }
    const gameId = pool.shift()!
    schedule.push({ round, gameId, seed: `${roomCode}-r${round}-${gameId}` })
  }

  return schedule
}
```

**Step 4: Futtasd — elvárt: 14 passed**

**Step 5: Commit**

```bash
git add src/core/room.ts src/core/room.test.ts
git commit -m "feat: add room codes and a non-repeating game schedule"
```

---

# Fázis 2 — Szinkron réteg

### Task 10: SyncAdapter interfész

**Files:**
- Create: `src/sync/SyncAdapter.ts`

**Step 1: `src/sync/SyncAdapter.ts`**

```ts
import type { GameResult, RoomMeta, RoomState, TeamId, TeamInfo } from '../core/types'

export type ConnectionStatus = 'connecting' | 'online' | 'offline'

/**
 * Mindent, ami hálózatot érint, ez az interfész takar el. Két
 * implementációja van: MockAdapter (fejlesztéshez, szerver nélkül)
 * és FirebaseAdapter (élesben). A React kód egyiket sem ismeri közvetlenül.
 */
export interface SyncAdapter {
  createRoom(meta: RoomMeta): Promise<void>
  roomExists(roomCode: string): Promise<boolean>
  joinRoom(roomCode: string, team: TeamInfo): Promise<void>
  markStarted(roomCode: string, round: number, teamId: TeamId): Promise<void>
  submitResult(roomCode: string, round: number, teamId: TeamId, result: GameResult): Promise<void>
  /** Feliratkozás a szoba állapotára. A visszatérési érték leiratkoztat. */
  subscribe(roomCode: string, onState: (state: RoomState | null) => void): () => void
  /** Feliratkozás a kapcsolat állapotára, hogy a UI jelezhesse az offline módot. */
  subscribeStatus(onStatus: (status: ConnectionStatus) => void): () => void
}
```

**Step 2: Ellenőrzés**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/sync/SyncAdapter.ts
git commit -m "feat: define the SyncAdapter interface"
```

---

### Task 11: MockAdapter (fejlesztéshez, szerver nélkül)

Ez teszi lehetővé, hogy **azonnal tesztelj**, Firebase projekt létrehozása nélkül. Két böngészőfül ugyanazon a gépen két autóként viselkedik.

**Files:**
- Create: `src/sync/MockAdapter.ts`
- Test: `src/sync/MockAdapter.test.ts`

**Step 1: Teszt — `src/sync/MockAdapter.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MockAdapter } from './MockAdapter'
import type { RoomMeta, RoomState, TeamInfo } from '../core/types'

const meta: RoomMeta = { roomCode: 'AB2C', roundSeconds: 900, createdAt: 1, schedule: [] }
const car1: TeamInfo = { id: 'car1', name: 'Car 1', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 }
const car2: TeamInfo = { id: 'car2', name: 'Car 2', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 }

describe('MockAdapter', () => {
  beforeEach(() => localStorage.clear())

  it('reports a room as missing before it is created', async () => {
    expect(await new MockAdapter().roomExists('AB2C')).toBe(false)
  })

  it('creates a room and finds it', async () => {
    const a = new MockAdapter()
    await a.createRoom(meta)
    expect(await a.roomExists('AB2C')).toBe(true)
  })

  it('pushes state to a subscriber immediately', async () => {
    const a = new MockAdapter()
    await a.createRoom(meta)
    const seen = vi.fn()
    a.subscribe('AB2C', seen)
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ meta }))
  })

  it('shares state between two independent adapter instances', async () => {
    // Ez modellezi a két böngészőfület.
    const tabA = new MockAdapter()
    const tabB = new MockAdapter()
    await tabA.createRoom(meta)
    await tabA.joinRoom('AB2C', car1)
    await tabB.joinRoom('AB2C', car2)

    let state: RoomState | null = null
    tabA.subscribe('AB2C', (s) => { state = s })
    expect(Object.keys(state!.teams).sort()).toEqual(['car1', 'car2'])
  })

  it('records a start timestamp', async () => {
    const a = new MockAdapter()
    await a.createRoom(meta)
    await a.joinRoom('AB2C', car1)
    await a.markStarted('AB2C', 1, 'car1')
    let state: RoomState | null = null
    a.subscribe('AB2C', (s) => { state = s })
    expect(state!.rounds[1].started!.car1).toBeGreaterThan(0)
  })

  it('records a result', async () => {
    const a = new MockAdapter()
    await a.createRoom(meta)
    await a.joinRoom('AB2C', car1)
    await a.submitResult('AB2C', 1, 'car1', { points: 700, rawScore: '7/10', items: [true], timeMs: 500 })
    let state: RoomState | null = null
    a.subscribe('AB2C', (s) => { state = s })
    expect(state!.rounds[1].done!.car1.points).toBe(700)
  })

  it('notifies subscribers when another instance writes', async () => {
    const tabA = new MockAdapter()
    const tabB = new MockAdapter()
    await tabA.createRoom(meta)
    const seen = vi.fn()
    tabA.subscribe('AB2C', seen)
    seen.mockClear()
    await tabB.joinRoom('AB2C', car2)
    expect(seen).toHaveBeenCalled()
  })

  it('stops notifying after unsubscribe', async () => {
    const a = new MockAdapter()
    await a.createRoom(meta)
    const seen = vi.fn()
    const off = a.subscribe('AB2C', seen)
    off()
    seen.mockClear()
    await a.joinRoom('AB2C', car1)
    expect(seen).not.toHaveBeenCalled()
  })

  it('always reports online status', () => {
    const seen = vi.fn()
    new MockAdapter().subscribeStatus(seen)
    expect(seen).toHaveBeenCalledWith('online')
  })
})
```

**Step 2: Futtasd — elvárt: FAIL**

**Step 3: Implementáció — `src/sync/MockAdapter.ts`**

```ts
import type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
import type { GameResult, RoomMeta, RoomState, TeamId, TeamInfo } from '../core/types'

const PREFIX = 'roadtrip:room:'
const CHANNEL = 'roadtrip-sync'

/**
 * Szerver nélküli adapter fejlesztéshez és teszteléshez.
 * A localStorage tárol, a BroadcastChannel értesíti a többi fület.
 * Ugyanazt az interfészt valósítja meg, mint a FirebaseAdapter, ezért
 * a UI kódnak fogalma sincs róla, melyik fut alatta.
 */
export class MockAdapter implements SyncAdapter {
  private channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null

  private key(roomCode: string) {
    return PREFIX + roomCode
  }

  private read(roomCode: string): RoomState | null {
    const raw = localStorage.getItem(this.key(roomCode))
    return raw ? (JSON.parse(raw) as RoomState) : null
  }

  private write(roomCode: string, state: RoomState) {
    localStorage.setItem(this.key(roomCode), JSON.stringify(state))
    this.channel?.postMessage(roomCode)
  }

  /** Olvas, módosít, visszaír. Egy szálon fut, ezért nem kell zárolás. */
  private mutate(roomCode: string, fn: (state: RoomState) => void) {
    const state = this.read(roomCode)
    if (!state) throw new Error(`Room ${roomCode} does not exist`)
    fn(state)
    this.write(roomCode, state)
  }

  async createRoom(meta: RoomMeta): Promise<void> {
    this.write(meta.roomCode, { meta, teams: {}, rounds: {} })
  }

  async roomExists(roomCode: string): Promise<boolean> {
    return this.read(roomCode) !== null
  }

  async joinRoom(roomCode: string, team: TeamInfo): Promise<void> {
    this.mutate(roomCode, (state) => {
      state.teams[team.id] = team
    })
  }

  async markStarted(roomCode: string, round: number, teamId: TeamId): Promise<void> {
    this.mutate(roomCode, (state) => {
      state.rounds[round] ??= {}
      state.rounds[round].started ??= {}
      state.rounds[round].started![teamId] = Date.now()
    })
  }

  async submitResult(
    roomCode: string, round: number, teamId: TeamId, result: GameResult,
  ): Promise<void> {
    this.mutate(roomCode, (state) => {
      state.rounds[round] ??= {}
      state.rounds[round].done ??= {}
      state.rounds[round].done![teamId] = result
    })
  }

  subscribe(roomCode: string, onState: (state: RoomState | null) => void): () => void {
    const push = () => onState(this.read(roomCode))
    push()

    const onMessage = (event: MessageEvent) => {
      if (event.data === roomCode) push()
    }
    // A storage esemény akkor jön, ha MÁSIK fül írt; a BroadcastChannel
    // pedig ugyanezt fedi le a modern böngészőkben. Mindkettőre feliratkozunk.
    const onStorage = (event: StorageEvent) => {
      if (event.key === this.key(roomCode)) push()
    }

    this.channel?.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)

    return () => {
      this.channel?.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
    }
  }

  subscribeStatus(onStatus: (status: ConnectionStatus) => void): () => void {
    onStatus('online')
    return () => {}
  }
}
```

**Step 4: Futtasd — elvárt: 9 passed**

**Step 5: Commit**

```bash
git add src/sync/MockAdapter.ts src/sync/MockAdapter.test.ts
git commit -m "feat: add server-free MockAdapter for cross-tab development"
```

---

### Task 12: FirebaseAdapter

**Files:**
- Create: `src/sync/FirebaseAdapter.ts`
- Create: `src/sync/index.ts`
- Create: `.env.example`

**Step 1: Telepítés**

```bash
npm install firebase
```

**Step 2: `.env.example`**

```
VITE_SYNC_BACKEND=mock
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
```

**Step 3: `src/sync/FirebaseAdapter.ts`**

```ts
import { initializeApp } from 'firebase/app'
import {
  type Database, get, getDatabase, onValue, ref, serverTimestamp, set, update,
} from 'firebase/database'
import type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
import type { GameResult, RoomMeta, RoomState, TeamId, TeamInfo } from '../core/types'

export class FirebaseAdapter implements SyncAdapter {
  private db: Database

  constructor() {
    const app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    })
    this.db = getDatabase(app)
  }

  async createRoom(meta: RoomMeta): Promise<void> {
    await set(ref(this.db, `rooms/${meta.roomCode}/meta`), meta)
  }

  async roomExists(roomCode: string): Promise<boolean> {
    return (await get(ref(this.db, `rooms/${roomCode}/meta`))).exists()
  }

  async joinRoom(roomCode: string, team: TeamInfo): Promise<void> {
    await set(ref(this.db, `rooms/${roomCode}/teams/${team.id}`), team)
  }

  async markStarted(roomCode: string, round: number, teamId: TeamId): Promise<void> {
    await update(ref(this.db, `rooms/${roomCode}/rounds/${round}/started`), {
      [teamId]: serverTimestamp(),
    })
  }

  async submitResult(
    roomCode: string, round: number, teamId: TeamId, result: GameResult,
  ): Promise<void> {
    // Az SDK sorba állítja ezt az írást, ha épp nincs hálózat, és
    // visszatéréskor magától elküldi. Ezért NEM várunk rá a UI-ban.
    await set(ref(this.db, `rooms/${roomCode}/rounds/${round}/done/${teamId}`), result)
  }

  subscribe(roomCode: string, onState: (state: RoomState | null) => void): () => void {
    return onValue(ref(this.db, `rooms/${roomCode}`), (snapshot) => {
      const value = snapshot.val()
      if (!value?.meta) return onState(null)
      // A Firebase kihagyja az üres objektumokat, ezért mindet alapértelmezzük.
      onState({ meta: value.meta, teams: value.teams ?? {}, rounds: value.rounds ?? {} })
    })
  }

  subscribeStatus(onStatus: (status: ConnectionStatus) => void): () => void {
    onStatus('connecting')
    return onValue(ref(this.db, '.info/connected'), (snapshot) => {
      onStatus(snapshot.val() === true ? 'online' : 'offline')
    })
  }
}
```

**Step 4: `src/sync/index.ts`**

```ts
import { FirebaseAdapter } from './FirebaseAdapter'
import { MockAdapter } from './MockAdapter'
import type { SyncAdapter } from './SyncAdapter'

let instance: SyncAdapter | null = null

/** Egyetlen adapter az egész appra, a környezet alapján kiválasztva. */
export function getSyncAdapter(): SyncAdapter {
  if (!instance) {
    instance = import.meta.env.VITE_SYNC_BACKEND === 'firebase'
      ? new FirebaseAdapter()
      : new MockAdapter()
  }
  return instance
}

export type { SyncAdapter, ConnectionStatus } from './SyncAdapter'
```

**Step 5: Ellenőrzés**

```bash
npx tsc --noEmit && npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Firebase realtime adapter behind the sync interface"
```

---

### Task 13: `useRoom` hook

**Files:**
- Create: `src/sync/useRoom.ts`
- Test: `src/sync/useRoom.test.tsx`

**Step 1: Teszt — `src/sync/useRoom.test.tsx`**

```tsx
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MockAdapter } from './MockAdapter'
import { useRoom } from './useRoom'
import { buildSchedule } from '../core/room'
import type { RoomMeta, TeamInfo } from '../core/types'

const meta: RoomMeta = {
  roomCode: 'AB2C', roundSeconds: 900, createdAt: 1,
  schedule: buildSchedule('AB2C', ['trivia'], 3),
}
const car1: TeamInfo = { id: 'car1', name: 'Car 1', emoji: '🚗', colorIndex: 0, joinedAtRound: 1 }
const car2: TeamInfo = { id: 'car2', name: 'Car 2', emoji: '🚙', colorIndex: 1, joinedAtRound: 1 }

describe('useRoom', () => {
  let adapter: MockAdapter
  beforeEach(async () => {
    localStorage.clear()
    adapter = new MockAdapter()
    await adapter.createRoom(meta)
    await adapter.joinRoom('AB2C', car1)
    await adapter.joinRoom('AB2C', car2)
  })

  it('exposes the room state', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())
    expect(result.current.state!.meta.roomCode).toBe('AB2C')
  })

  it('starts on round 1 unlocked', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())
    expect(result.current.currentRound).toBe(1)
    expect(result.current.canStart).toBe(true)
  })

  it('blocks the next round while the other team is still playing', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())

    await act(async () => {
      await result.current.submitResult({ points: 700, rawScore: '7', items: [true], timeMs: 10 })
    })

    // A car1 végzett, a car2 még nem: nem léphetünk tovább.
    await waitFor(() => expect(result.current.myStatus).toBe('done'))
    expect(result.current.canStart).toBe(false)
    expect(result.current.currentRound).toBe(1)
  })

  it('advances once every team has finished', async () => {
    const { result } = renderHook(() => useRoom(adapter, 'AB2C', 'car1'))
    await waitFor(() => expect(result.current.state).not.toBeNull())

    await act(async () => {
      await result.current.submitResult({ points: 700, rawScore: '7', items: [true], timeMs: 10 })
      await adapter.submitResult('AB2C', 1, 'car2', { points: 500, rawScore: '5', items: [false], timeMs: 20 })
    })

    await waitFor(() => expect(result.current.currentRound).toBe(2))
    expect(result.current.canStart).toBe(true)
  })
})
```

**Step 2: Futtasd — elvárt: FAIL**

**Step 3: Implementáció — `src/sync/useRoom.ts`**

```ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
import { isRoundUnlocked, teamRoundStatus, teamsStillPlaying } from '../core/roundGate'
import { standings } from '../core/scoring'
import type { GameResult, RoomState, TeamId } from '../core/types'

export function useRoom(adapter: SyncAdapter, roomCode: string, myTeamId: TeamId) {
  const [state, setState] = useState<RoomState | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => adapter.subscribe(roomCode, setState), [adapter, roomCode])
  useEffect(() => adapter.subscribeStatus(setStatus), [adapter])

  /**
   * Az aktuális kör a legkisebb olyan sorszám, amit MÉG NEM fejezett be
   * mindenki. Ez levezetett érték, nem tárolt — így két eszköz sosem
   * kerülhet ellentmondásba egymással.
   */
  const currentRound = useMemo(() => {
    if (!state) return 1
    let round = 1
    while (isRoundUnlocked(state, round + 1)) round++
    return round
  }, [state])

  const myStatus = state ? teamRoundStatus(state, currentRound, myTeamId) : 'not-started'
  const waitingFor = state ? teamsStillPlaying(state, currentRound) : []
  const table = useMemo(() => (state ? standings(state) : []), [state])

  const start = useCallback(
    () => adapter.markStarted(roomCode, currentRound, myTeamId),
    [adapter, roomCode, currentRound, myTeamId],
  )

  const submitResult = useCallback(
    (result: GameResult) => adapter.submitResult(roomCode, currentRound, myTeamId, result),
    [adapter, roomCode, currentRound, myTeamId],
  )

  return {
    state,
    status,
    currentRound,
    myStatus,
    /** Elindíthatom-e most a kört? Csak akkor, ha még nem játszottam le. */
    canStart: myStatus === 'not-started',
    /** Kikre várunk még, mielőtt bárki továbbléphet. */
    waitingFor: waitingFor.filter((t) => t.id !== myTeamId),
    standings: table,
    schedule: state?.meta.schedule ?? [],
    start,
    submitResult,
  }
}
```

**Step 4: Futtasd — elvárt: 4 passed**

**Step 5: Commit**

```bash
git add src/sync/useRoom.ts src/sync/useRoom.test.tsx
git commit -m "feat: add useRoom hook deriving current round from the gate"
```

---

# Fázis 3 — Játékmodul-keretrendszer

### Task 14: GameModule interfész és regiszter

**Files:**
- Create: `src/games/types.ts`
- Create: `src/games/registry.ts`
- Test: `src/games/registry.test.ts`

**Step 1: `src/games/types.ts`**

```ts
import type { Rng } from '../core/rng'
import type { GameResult } from '../core/types'

export interface GameProps<TItem> {
  items: TItem[]
  durationSec: number
  onComplete: (result: GameResult) => void
}

export interface GameModule<TItem = unknown> {
  id: string
  /** i18n kulcs, pl. "games.trivia.title" */
  titleKey: string
  descriptionKey: string
  icon: string
  /** Determinisztikus feladatsor a seedből. Ugyanaz a seed = ugyanaz a sor. */
  buildItems(rng: Rng): TItem[]
  Component: React.FC<GameProps<TItem>>
}
```

**Step 2: Teszt — `src/games/registry.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { GAMES, GAME_IDS, getGame } from './registry'
import { createRng } from '../core/rng'

describe('game registry', () => {
  it('has at least one game', () => {
    expect(GAME_IDS.length).toBeGreaterThan(0)
  })

  it('uses unique ids', () => {
    expect(new Set(GAME_IDS).size).toBe(GAME_IDS.length)
  })

  it('matches every id to its module key', () => {
    for (const [key, game] of Object.entries(GAMES)) {
      expect(game.id).toBe(key)
    }
  })

  it('builds a non-empty deterministic item list for every game', () => {
    for (const game of Object.values(GAMES)) {
      const a = game.buildItems(createRng('seed-1'))
      const b = game.buildItems(createRng('seed-1'))
      expect(a.length, `${game.id} produced no items`).toBeGreaterThan(0)
      expect(a, `${game.id} is not deterministic`).toEqual(b)
    }
  })

  it('throws for an unknown id', () => {
    expect(() => getGame('nope')).toThrow()
  })
})
```

**Step 3: Implementáció — `src/games/registry.ts`**

```ts
import type { GameModule } from './types'

// A játékmodulokat ide vesszük fel, ahogy elkészülnek.
// Egy új játék hozzáadása EGY sor itt, plusz egy fájl — a motor nem változik.
const modules: GameModule<never>[] = []

export const GAMES: Record<string, GameModule<never>> = Object.fromEntries(
  modules.map((m) => [m.id, m]),
)

export const GAME_IDS = Object.keys(GAMES)

export function getGame(id: string): GameModule<never> {
  const game = GAMES[id]
  if (!game) throw new Error(`Unknown game: ${id}`)
  return game
}
```

**Step 4: Futtasd** — az „at least one game" teszt most még megbukik. **Ez rendben van**, a következő taskban javul. Jelöld `it.skip`-pel, és vedd vissza a 17. task végén.

**Step 5: Commit**

```bash
git add src/games/
git commit -m "feat: add GameModule interface and registry"
```

---

### Task 15: Időzítő hook

**Files:**
- Create: `src/ui/useCountdown.ts`
- Test: `src/ui/useCountdown.test.ts`

**Step 1: Teszt**

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts at the full duration', () => {
    const { result } = renderHook(() => useCountdown(10, () => {}))
    expect(result.current.secondsLeft).toBe(10)
  })

  it('counts down', () => {
    const { result } = renderHook(() => useCountdown(10, () => {}))
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.secondsLeft).toBe(7)
  })

  it('fires the callback exactly once at zero', () => {
    const onExpire = vi.fn()
    renderHook(() => useCountdown(2, onExpire))
    act(() => { vi.advanceTimersByTime(5000) })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('never goes below zero', () => {
    const { result } = renderHook(() => useCountdown(2, () => {}))
    act(() => { vi.advanceTimersByTime(9000) })
    expect(result.current.secondsLeft).toBe(0)
  })
})
```

**Step 2: Futtasd — elvárt: FAIL**

**Step 3: Implementáció — `src/ui/useCountdown.ts`**

```ts
import { useEffect, useRef, useState } from 'react'

/**
 * Wall-clock alapú visszaszámláló. Azért a Date.now() a forrás és nem a
 * tick-ek száma, mert a telefon háttérbe kerülésekor a böngésző fojtja
 * a timereket — a tick-számlálás így elcsúszna, a wall clock nem.
 */
export function useCountdown(durationSec: number, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(durationSec)
  const startedAt = useRef(Date.now())
  const fired = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startedAt.current) / 1000
      const left = Math.max(0, Math.ceil(durationSec - elapsed))
      setSecondsLeft(left)
      if (left === 0 && !fired.current) {
        fired.current = true
        onExpireRef.current()
      }
    }
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [durationSec])

  return { secondsLeft, elapsedMs: () => Date.now() - startedAt.current }
}
```

**Step 4: Futtasd — elvárt: 4 passed**

**Step 5: Commit**

```bash
git add src/ui/useCountdown.ts src/ui/useCountdown.test.ts
git commit -m "feat: add wall-clock countdown that survives backgrounding"
```

---

### Task 16: QuizRunner — a közös feladatmotor

Hat játék használja majd. Ő biztosítja a **csalásbiztonságot**: a helyes válasz csak a rögzítés után kerül a DOM-ba, és visszalépni nem lehet.

**Files:**
- Create: `src/ui/QuizRunner.tsx`
- Test: `src/ui/QuizRunner.test.tsx`

**Step 1: Teszt — `src/ui/QuizRunner.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuizRunner } from './QuizRunner'

const items = [
  { prompt: 'Q1', choices: ['a', 'b'], correctIndex: 0 },
  { prompt: 'Q2', choices: ['c', 'd'], correctIndex: 1 },
]

function setup(onComplete = vi.fn()) {
  render(
    <QuizRunner
      items={items}
      durationSec={600}
      perItemSec={30}
      revealMs={0}
      renderPrompt={(item) => <p>{item.prompt}</p>}
      getChoices={(item) => item.choices}
      isCorrect={(item, choiceIndex) => choiceIndex === item.correctIndex}
      onComplete={onComplete}
    />,
  )
  return onComplete
}

describe('QuizRunner', () => {
  it('shows the first prompt', () => {
    setup()
    expect(screen.getByText('Q1')).toBeInTheDocument()
  })

  it('does not put the correct answer in the DOM before answering', () => {
    setup()
    // Csalásvédelem: semmi nem árulhatja el, melyik a jó válasz.
    expect(document.body.innerHTML).not.toMatch(/correct|data-correct/i)
  })

  it('advances to the next item after an answer', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'a' }))
    expect(await screen.findByText('Q2')).toBeInTheDocument()
  })

  it('reports results once every item is answered', async () => {
    const onComplete = setup()
    await userEvent.click(screen.getByRole('button', { name: 'a' })) // helyes
    await userEvent.click(await screen.findByRole('button', { name: 'c' })) // helytelen
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ items: [true, false], rawScore: '1 / 2' }),
    )
  })

  it('normalises points to the shared scale', async () => {
    const onComplete = setup()
    await userEvent.click(screen.getByRole('button', { name: 'a' }))
    await userEvent.click(await screen.findByRole('button', { name: 'd' }))
    expect(onComplete.mock.calls[0][0].points).toBe(1000)
  })

  it('shows progress', () => {
    setup()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })
})
```

**Step 2: Futtasd — elvárt: FAIL**

**Step 3: Implementáció — `src/ui/QuizRunner.tsx`**

```tsx
import { useCallback, useRef, useState } from 'react'
import { useCountdown } from './useCountdown'
import { normalize } from '../core/scoring'
import type { GameResult } from '../core/types'

export interface QuizRunnerProps<TItem> {
  items: TItem[]
  durationSec: number
  perItemSec?: number
  /** Meddig látszik a visszajelzés a válasz után. Tesztben 0. */
  revealMs?: number
  renderPrompt: (item: TItem, index: number) => React.ReactNode
  getChoices: (item: TItem) => string[]
  isCorrect: (item: TItem, choiceIndex: number) => boolean
  /** Feladatonkénti súly, pl. a Rapid Trivia utolsó öt kérdése dupla. */
  weightOf?: (item: TItem, index: number) => number
  onComplete: (result: GameResult) => void
}

export function QuizRunner<TItem>({
  items, durationSec, perItemSec, revealMs = 900,
  renderPrompt, getChoices, isCorrect, weightOf = () => 1, onComplete,
}: QuizRunnerProps<TItem>) {
  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState<number | null>(null)
  const answers = useRef<boolean[]>([])
  const startedAt = useRef(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    const correct = answers.current
    const earned = items.reduce(
      (sum, item, i) => sum + (correct[i] ? weightOf(item, i) : 0), 0,
    )
    const max = items.reduce((sum, item, i) => sum + weightOf(item, i), 0)

    onComplete({
      points: normalize(earned, max),
      rawScore: `${correct.filter(Boolean).length} / ${items.length}`,
      items: items.map((_, i) => correct[i] === true),
      timeMs: Date.now() - startedAt.current,
    })
  }, [items, weightOf, onComplete])

  useCountdown(durationSec, finish)

  const answer = (choiceIndex: number) => {
    if (locked !== null) return // egy feladat egy válasz, visszalépés nincs
    answers.current[index] = isCorrect(items[index], choiceIndex)
    setLocked(choiceIndex)

    const next = () => {
      if (index + 1 >= items.length) return finish()
      setIndex(index + 1)
      setLocked(null)
    }
    revealMs > 0 ? setTimeout(next, revealMs) : next()
  }

  const item = items[index]
  const choices = getChoices(item)

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{index + 1} / {items.length}</span>
        {perItemSec != null && <span aria-hidden>⏱</span>}
      </div>

      <div className="flex-1 text-center text-2xl font-semibold">
        {renderPrompt(item, index)}
      </div>

      <div className="grid gap-3">
        {choices.map((choice, i) => {
          // A helyes válasz CSAK a rögzítés után kerül a DOM-ba.
          const revealed = locked !== null
          const good = revealed && isCorrect(item, i)
          const badPick = revealed && locked === i && !good
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={revealed}
              className={[
                'min-h-16 rounded-2xl px-4 text-lg font-medium transition',
                !revealed && 'bg-slate-700 active:bg-slate-600',
                good && 'bg-green-600',
                badPick && 'bg-red-600',
                revealed && !good && !badPick && 'bg-slate-800 opacity-50',
              ].filter(Boolean).join(' ')}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 4: Futtasd — elvárt: 6 passed**

**Step 5: Commit**

```bash
git add src/ui/QuizRunner.tsx src/ui/QuizRunner.test.tsx
git commit -m "feat: add QuizRunner with lock-then-reveal cheat protection"
```

---

# Fázis 4 — A tíz játék

**Az itt következő tíz task mind ugyanazt a mintát követi.** A 17-es tartalmazza a teljes kidolgozást; a többinél csak az eltéréseket írom le, mert a szerkezet azonos.

Minden játéknál kötelező teszt:
1. `buildItems` ugyanazt adja ugyanarra a seedre
2. `buildItems` elég feladatot ad a 15 perc kitöltésére
3. minden feladatnak pontosan egy helyes válasza van
4. a helyes válasz nincs a DOM-ban a rögzítés előtt

### Task 17: Rapid Trivia (teljes minta)

**Files:**
- Create: `src/games/trivia/questions.en.ts`
- Create: `src/games/trivia/index.tsx`
- Test: `src/games/trivia/trivia.test.tsx`
- Modify: `src/games/registry.ts`

**Step 1: Tartalom — `src/games/trivia/questions.en.ts`**

```ts
export interface TriviaQuestion {
  id: string
  prompt: { en: string; hu?: string }
  choices: { en: string[]; hu?: string[] }
  correctIndex: number
  category: 'geography' | 'science' | 'history' | 'culture' | 'sport' | 'food'
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 'geo-1',
    prompt: { en: 'Which country has the most natural lakes?' },
    choices: { en: ['Canada', 'Russia', 'Finland', 'Brazil'] },
    correctIndex: 0,
    category: 'geography',
  },
  // ... a 34. task tölti fel 120 kérdésre
]
```

Kezdd **12 kérdéssel**, hogy a teszt zöld legyen; a tömeges feltöltés a 34. task.

**Step 2: Teszt — `src/games/trivia/trivia.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import triviaGame from './index'
import { createRng } from '../../core/rng'
import { TRIVIA_QUESTIONS } from './questions.en'

describe('trivia game', () => {
  it('is deterministic for a seed', () => {
    expect(triviaGame.buildItems(createRng('s'))).toEqual(triviaGame.buildItems(createRng('s')))
  })

  it('differs between seeds', () => {
    const a = triviaGame.buildItems(createRng('s1')).map(q => q.id)
    const b = triviaGame.buildItems(createRng('s2')).map(q => q.id)
    expect(a).not.toEqual(b)
  })

  it('never repeats a question within one round', () => {
    const ids = triviaGame.buildItems(createRng('s')).map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every question exactly one correct answer', () => {
    for (const q of TRIVIA_QUESTIONS) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(q.choices.en.length)
      expect(new Set(q.choices.en).size).toBe(q.choices.en.length)
    }
  })

  it('hides the correct answer until the player commits', () => {
    const items = triviaGame.buildItems(createRng('s'))
    render(<triviaGame.Component items={items} durationSec={900} onComplete={vi.fn()} />)
    const correct = items[0].choices.en[items[0].correctIndex]
    const buttons = screen.getAllByRole('button')
    // A jó válasz látszik gombként, de semmi nem jelöli meg jónak.
    expect(buttons.some(b => b.textContent === correct)).toBe(true)
    expect(document.body.innerHTML).not.toMatch(/correct/i)
  })
})
```

**Step 3: Futtasd — elvárt: FAIL**

**Step 4: Implementáció — `src/games/trivia/index.tsx`**

```tsx
import { QuizRunner } from '../../ui/QuizRunner'
import { TRIVIA_QUESTIONS, type TriviaQuestion } from './questions.en'
import type { GameModule } from '../types'

const QUESTION_COUNT = 30
const DOUBLE_FROM = 25 // az utolsó öt kérdés duplán számít

const triviaGame: GameModule<TriviaQuestion> = {
  id: 'trivia',
  titleKey: 'games.trivia.title',
  descriptionKey: 'games.trivia.description',
  icon: '🧠',

  buildItems: (rng) => rng.pick(TRIVIA_QUESTIONS, Math.min(QUESTION_COUNT, TRIVIA_QUESTIONS.length)),

  Component: ({ items, durationSec, onComplete }) => (
    <QuizRunner
      items={items}
      durationSec={durationSec}
      perItemSec={25}
      renderPrompt={(q) => q.prompt.en}
      getChoices={(q) => q.choices.en}
      isCorrect={(q, i) => i === q.correctIndex}
      weightOf={(_, index) => (index >= DOUBLE_FROM ? 2 : 1)}
      onComplete={onComplete}
    />
  ),
}

export default triviaGame
```

**Step 5:** Vedd fel a regiszterbe (`src/games/registry.ts`):

```ts
import triviaGame from './trivia'
const modules: GameModule<never>[] = [triviaGame as GameModule<never>]
```

Vedd vissza a 14. taskban `skip`-elt tesztet.

**Step 6: Futtasd**

```bash
npm test
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Rapid Trivia game with weighted final questions"
```

---

### Task 18: **ELSŐ VALÓDI PRÓBA** — minimál útvonal

Itt már végig tudsz játszani egy teljes kört két fülön. Ez a terv legfontosabb ellenőrzőpontja.

**Files:**
- Create: `src/App.tsx` (átírás), `src/screens/JoinScreen.tsx`, `src/screens/RoundScreen.tsx`

Nyers, csúnya felület — **csak az áramlás számít**: szoba létrehozás → csatlakozás → kör indítás → játék → várakozás → következő kör.

**Step 1:** Írd meg a három komponenst úgy, hogy a `useRoom` hookot használják és a `getGame(schedule[currentRound-1].gameId)`-vel töltsék be a játékot.

**Step 2: Kézi teszt**

```bash
npm run dev
```

Nyiss **két böngészőfület**:
1. Fül A: szoba létrehozása → jegyezd meg a kódot → csatlakozás Car 1-ként
2. Fül B: ugyanaz a kód → csatlakozás Car 2-ként
3. Fül A: kör indítása, végigjátszás → **várakozó képernyőre kell kerülnie**
4. Ellenőrizd: Fül A **nem tud** továbbmenni a 2. körre
5. Fül B: kör indítása, végigjátszás
6. Ellenőrizd: **mindkét fül** automatikusan a 2. körre lép

Ha a 4. lépés nem teljesül, a kör-kapu hibás — ne menj tovább.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add minimal join and round screens for end-to-end testing"
```

---

### Task 19–26: A további kilenc játék

Mind ugyanazzal a mintával, mint a 17. task. Rövid specifikáció játékonként:

| Task | Játék | `buildItems` | Komponens | Pontozás |
|---|---|---|---|---|
| 19 | **Wager Round** (`wager`) | 10 kérdés a trivia készletből | Saját: tét választása (10/25/50%) a kérdés előtt | tét-súlyozott `normalize` |
| 20 | **Closest Wins** (`closest`) | 15 numerikus tény | Saját: számbeviteli mező | `proximityPoints`, összegezve |
| 21 | **Zoom Reveal** (`zoom`) | 12 SVG + 4 opció | Saját: SVG `viewBox` animáció, 4 zoom-szint | korábbi tipp = több pont |
| 22 | **Flag & Silhouette** (`flags`) | 25 SVG zászló/körvonal | `QuizRunner`, `renderPrompt` SVG-t ad vissza | válaszkulcs |
| 23 | **Emoji Decode** (`emoji`) | 20 emoji-lánc | `QuizRunner` | válaszkulcs |
| 24 | **Anagram Rush** (`anagram`) | 20 kevert szó | Saját: szöveges beviteli mező | pontos egyezés, kisbetűsítve |
| 25 | **Letter Blitz** (`letters`) | 6× (betű + zárt kategória) | Saját: 90 mp-es listaépítő | listaellenőrzés + egyediség-bónusz |
| 26 | **Word Grid** (`wordgrid`) | 4 növekvő rács | Saját: rács-húzás | megtalált szavak aránya |

Külön figyelmet igénylő pontok:

**Task 21 — Zoom Reveal.** Az SVG `viewBox` szűkítésével nagyítunk. Négy szint: `viewBox` a teljes kép 15% → 35% → 65% → 100%-a. Pontozás: 100 / 75 / 50 / 25 pont aszerint, hányadik szinten talált. Fontos: a **teljes SVG végig a DOM-ban van**, csak a `viewBox` vág — ez elvileg kiolvasható a forrásból. Mivel a válaszlehetőségek szövegesen jelennek meg és a kép önmagában nem árulja el a nevet, ez elfogadható. Ha mégis zavaró, a 4 opció sorrendjének megkeverése a seedből elég védelem.

**Task 25 — Letter Blitz.** Ez a legösszetettebb.

- `src/games/letters/wordlists.ts` — teljes, zárt listák: országok (~195), fővárosok (~195), kémiai elemek (118), autómárkák (~80), állatok (~300)
- Az ellenőrzés kisbetűsített, ékezet nélküli normalizálással történik
- A beírt szavak a `GameResult.payload.words` alatt mennek fel a szerverre
- **Az egyediség-bónusz nem a játékban dől el**, hanem az összehasonlító képernyőn, amikor mindkét csapat `payload`-ja megvan. A játék `points` értéke az alapszám; a bónusz külön sorként jelenik meg. Ezt így kell megcsinálni, mert a játék végén a másik csapat eredménye még nem létezik.

**Task 26 — Word Grid.** A rácsot a seedből generáljuk: elhelyezünk N szót vízszintesen/függőlegesen/átlósan, a maradékot véletlen betűvel töltjük. A megoldás (koordináták) a modulban marad, a DOM-ba nem kerül.

Minden taskhoz: teszt → fail → implementáció → pass → commit.

---

# Fázis 5 — Képernyők

### Task 27: Alkalmazás-váz és útvonalválasztás

**Files:** `src/App.tsx`, `src/state/session.ts`

A csapatazonosító és a szobakód `localStorage`-ban él, hogy egy véletlen frissítés ne dobjon ki a játékból — autóban ez tényleg meg fog történni.

### Task 28: Csatlakozó képernyő

**Files:** `src/screens/JoinScreen.tsx` + teszt

Szoba létrehozása (kód generálás, csapatszám nem kötött) vagy csatlakozás kóddal. Csapatnév, emoji, szín választása. Nagy célfelületek — rázkódó autóban a telefon nem pontos.

### Task 29: Kör-előkészítő és várakozó képernyő

**Files:** `src/screens/RoundLobby.tsx` + teszt

Ez mutatja a következő játék nevét és leírását, a nagy **START** gombot, és — ha már végeztél — a másik autó élő állapotát. Kötelező teszt: **ha a `canStart` hamis, a START gomb nincs a képernyőn.**

### Task 30: Összehasonlító képernyő

**Files:** `src/screens/RoundCompare.tsx` + teszt

- pontsáv csapatonként
- feladatonkénti zöld/piros rács egymás alatt
- „a kör fordulópontja": `items` tömbök összevetése, a legnagyobb eltérés
- felhasznált idő
- Letter Blitz esetén az egyediség-bónusz kiszámítása és megjelenítése

### Task 31: Állás képernyő

**Files:** `src/screens/Standings.tsx` + teszt

Összesített táblázat, megnyert körök száma, körről körre trendvonal.

---

# Fázis 6 — i18n

### Task 32: Nyelvi réteg

**Files:** `src/i18n/en.ts`, `src/i18n/hu.ts`, `src/i18n/useT.ts` + teszt

Saját, ~40 soros megoldás; nem kell i18next. Kötelező teszt: **minden `en` kulcsnak van `hu` párja** (most üres stringgel) — így a magyar fordításnál semmi nem marad ki. A nyelvváltó a beállításokban.

---

# Fázis 7 — Fejlesztői eszközök

### Task 33: Turbo mód és csapat-szimuláció

**Files:** `src/screens/DevPanel.tsx`

- körhossz 900 → 60 mp
- „Másik autó szimulálása" gomb: kitölti a többi csapat eredményét véletlen pontszámmal
- csak `import.meta.env.DEV` alatt látszik

---

# Fázis 8 — Tartalom és üzembe helyezés

### Task 34: Tartalomfeltöltés

Ez a leghosszabb, de legegyszerűbb task. Célszámok:

| Játék | Szükséges mennyiség | Miért ennyi |
|---|---|---|
| Trivia | 120 kérdés | 4 menet ismétlés nélkül |
| Closest Wins | 60 tény | 4 menet |
| Zoom Reveal | 48 SVG | 4 menet |
| Flags | 100 zászló + 40 sziluett | 4 menet |
| Emoji | 80 rejtvény | 4 menet |
| Anagram | 80 szó | 4 menet |
| Letter Blitz | 5 teljes szólista | végtelen kombináció |
| Word Grid | 200 szó | végtelen rács |

Commitolj **játékonként külön**, hogy a diff kezelhető maradjon.

### Task 35: Firebase beállítása

Ezt a felhasználó végzi, saját Google-fiókkal:

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → név: `roadtrip-game` → Analytics kikapcsolva
2. Bal oldalt **Build → Realtime Database** → **Create Database** → régió: `europe-west1` → **Start in test mode**
3. **Project settings → General → Your apps → Web (`</>`)** → app regisztrálása → másold ki az `apiKey`, `databaseURL`, `projectId` értékeket
4. Hozz létre egy `.env.local` fájlt a `.env.example` mintájára, `VITE_SYNC_BACKEND=firebase` értékkel
5. **Rules** fül — cseréld le erre, hogy a szobák 24 óra után lejárjanak és ne lehessen az egész adatbázist letölteni:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        ".validate": "$roomCode.length === 4"
      }
    }
  }
}
```

> **Megjegyzés a biztonságról:** ez a szabály bárkinek engedi az írást, aki ismeri a 4 karakteres kódot. Egy baráti játékhoz ez arányos — nincs benne személyes adat, és 24 óráig él. Ha zavar, a következő lépés Firebase Anonymous Auth bekapcsolása és a `.write` feltételhez `auth != null` hozzáadása.

**Ellenőrzés:** `npm run dev`, két fül, ugyanaz a folyamat, mint a 18. taskban — de most **két külön eszközről**, telefonról is.

### Task 36: Deploy Cloudflare Pages-re

1. Töltsd fel a repót GitHubra (`gh repo create kocsijatek --private --source=. --push`)
2. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**
3. Build command: `npm run build`, output: `dist`
4. **Settings → Environment variables** — vedd fel a négy `VITE_` változót
5. Deploy → kapsz egy `https://kocsijatek.pages.dev` címet

**Indulás előtt kötelező:** mindenki nyissa meg a linket telefonon, és **tegye ki a kezdőképernyőre** („Hozzáadás a kezdőképernyőhöz"). Ezzel a service worker letölti a teljes tartalmat, és az app alagútban is elindul.

---

## Az elkészültség kritériumai

- [ ] `npm test` — minden zöld
- [ ] `npx tsc --noEmit` — nincs hiba
- [ ] `npm run build` — sikeres
- [ ] Két fül: a 2. kör kapuja **zárva marad**, amíg mindkét csapat nem végzett
- [ ] Egy csapat elindíthatja a kört 10 perccel a másik után, és ez senkit nem akaszt meg
- [ ] Repülőgép módban a kör végigjátszható, és a hálózat visszatérésekor az eredmény feljut
- [ ] Mind a 10 játék pontozása gépi — sehol nincs kézzel beírható pontszám
- [ ] Minden `en` kulcsnak van `hu` helye
