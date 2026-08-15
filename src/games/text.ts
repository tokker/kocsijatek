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
