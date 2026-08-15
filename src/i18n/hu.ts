import type { TranslationKey } from './en'

/**
 * Magyar fordítás.
 *
 * Szándékosan üres: az induló verzió angol. A szerkezet viszont már
 * kész, tehát a magyar hozzáadása tartalomszerkesztés lesz, nem
 * kódolás — ide kell írni a kulcsokat, és a nyelvváltó máris működik.
 *
 * A hiányzó kulcsok automatikusan az angol változatra esnek vissza,
 * tehát részlegesen kitöltve is használható marad.
 */
export const hu: Partial<Record<TranslationKey, string>> = {}
