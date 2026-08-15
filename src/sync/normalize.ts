import type { GameResult, RoomState, RoundState, ScheduleEntry } from '../core/types'

/**
 * A Firebase Realtime Database nem őriz meg mindent úgy, ahogy beírtuk.
 * Két átalakítást végez, és mindkettő tönkreteszi a `RoomState` alakját:
 *
 * 1. Ha egy objektum MINDEN kulcsa egész szám és a legnagyobb kulcs kisebb
 *    a kulcsok számának kétszeresénél, tömbként adja vissza. A körök 1-től
 *    számozódnak, tehát a `rounds` tömbként érkezik, a 0. index pedig LYUK
 *    (nem `null`: a Firebase `array[key] = ...` értékadással építi). Az
 *    `Object.entries` a lyukakat kihagyja, ezért ez önmagában nem dob
 *    kivételt — csak a deklarált típussal megy szembe.
 * 2. Az üres objektumot és az üres tömböt NEM tárolja: a kulcs egyszerűen
 *    eltűnik. Ez a veszélyesebb: egy `items: []` mező `undefined`-ként jön
 *    vissza, és a hívó `.length`-je kivételt dob. Ugyanez a mechanizmus
 *    törli a Letter Blitz üres `words` listáit is — lásd `compare.ts`.
 *
 * Ez a modul visszaállítja a deklarált alakot, MIELŐTT az állapot elérné
 * a UI-t. Itt kell megtenni, nem a hívóknál: a torzulás egyetlen helyen
 * lép be, és így minden fogyasztó a típusban leírt adatot kapja.
 *
 * Miért nem derült ki tesztben: a MockAdapter localStorage-ba JSON-ozik,
 * ami a `{"1": ...}` kulcsokat objektumként hozza vissza, és az üres
 * tömböt megőrzi. Ez a két alak sosem találkozott teszttel.
 */

/** Firebase tömbösítését visszacsinálja: kulcsolt objektum, `null`-ok nélkül. */
export function asRecord<T>(value: unknown): Record<string, T> {
  if (value == null) return {}
  const source = value as Record<string, T | null>
  const out: Record<string, T> = {}
  for (const [key, item] of Object.entries(source)) {
    if (item != null) out[key] = item as T
  }
  return out
}

/** Ugyanaz tömb-alakú mezőkre: a lyukak kiesnek, a hiányzó mező üres tömb. */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value.filter((item): item is T => item != null)
  if (value == null) return []
  return Object.values(value as Record<string, T | null>).filter(
    (item): item is T => item != null,
  )
}

function normalizeResult(result: GameResult): GameResult {
  // Az `items` üres tömbként is értelmes eredmény (a csapat nem oldott meg
  // semmit), a Firebase viszont ilyenkor elhagyja a mezőt.
  return { ...result, items: asArray<boolean>(result.items) }
}

function normalizeRound(round: RoundState): RoundState {
  const done = asRecord<GameResult>(round.done)
  return {
    started: asRecord<number>(round.started),
    done: Object.fromEntries(
      Object.entries(done).map(([teamId, result]) => [teamId, normalizeResult(result)]),
    ),
  }
}

/**
 * A Firebase-ből érkező nyers érték `RoomState`-té alakítva, vagy `null`,
 * ha nincs ilyen szoba.
 */
export function normalizeRoomState(value: unknown): RoomState | null {
  const raw = value as { meta?: RoomState['meta']; teams?: unknown; rounds?: unknown } | null
  if (!raw?.meta) return null

  const rounds = asRecord<RoundState>(raw.rounds)

  return {
    meta: { ...raw.meta, schedule: asArray<ScheduleEntry>(raw.meta.schedule) },
    teams: asRecord(raw.teams),
    rounds: Object.fromEntries(
      Object.entries(rounds).map(([round, state]) => [round, normalizeRound(state)]),
    ),
  }
}
