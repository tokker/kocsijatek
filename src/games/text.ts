/**
 * Beírt szó összehasonlításra alkalmas alakra hozása.
 *
 * Elnéző a kisbetűvel, a szóközzel, a kötőjellel és az ékezetekkel:
 * mozgó autóban telefonon gépelve ezek nem tudásbeli különbségek, csak
 * bosszúságok lennének. "Côte d'Ivoire" és "cote divoire" ugyanaz.
 */
export function normalizeWord(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z]/g, '')
}

/** Vesszővel elválasztott listából normalizált halmaz. */
export function wordSet(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((entry) => normalizeWord(entry))
      .filter(Boolean),
  )
}

/**
 * Benne van-e a szó a listában, többes számot is elnézve.
 *
 * A lista zárt, tehát mindig lesz olyan helyes válasz, amit nem tartalmaz.
 * A többes szám viszont a leggyakoribb ilyen eset, és a legbosszantóbb:
 * a "TIGERS" ugyanaz az állat, mint a "TIGER". Egy szótárból visszautasított
 * jó válasz azt az érzést kelti, hogy a játék hibás — ezért itt inkább
 * elnézőek vagyunk.
 *
 * Csak akkor fogadjuk el, ha az EGYES számú alak tényleg szerepel a
 * listában; kitalálni nem kezdünk szavakat.
 */
export function matchesWord(words: Set<string>, word: string): boolean {
  if (words.has(word)) return true

  const singulars = [
    word.endsWith('S') && word.slice(0, -1), // TIGERS -> TIGER
    word.endsWith('ES') && word.slice(0, -2), // BOXES -> BOX
    word.endsWith('IES') && `${word.slice(0, -3)}Y`, // BERRIES -> BERRY
  ]

  return singulars.some((candidate) => candidate !== false && words.has(candidate))
}
