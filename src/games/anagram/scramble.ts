import type { Rng } from '../../core/rng'

/**
 * Összekeveri a szó betűit úgy, hogy az eredmény biztosan ELTÉRJEN az
 * eredetitől. Egy egyszerű keverés kis eséllyel visszaadhatja magát a
 * szót, és egy ilyen "rejtvény" ingyen pont lenne — ráadásul mindkét
 * autónál ugyanaz, tehát észrevétlenül torzítaná a kört.
 *
 * Determinisztikus: ugyanaz a seed ugyanazt a keverést adja, tehát a
 * két csapat pontosan ugyanazt a feladatot kapja.
 */
export function scramble(word: string, rng: Rng): string {
  const letters = [...word]
  // Azonos betűkből álló szót (pl. "AAA") nem lehet átrendezni.
  if (new Set(letters).size <= 1) return word

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = rng.shuffle(letters).join('')
    if (candidate !== word) return candidate
  }

  // Végső mentőöv: két szomszédos, eltérő betű cseréje mindig más szót ad.
  const swapped = [...letters]
  for (let i = 0; i < swapped.length - 1; i++) {
    if (swapped[i] !== swapped[i + 1]) {
      ;[swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]]
      break
    }
  }
  return swapped.join('')
}

export { normalizeWord as normalizeGuess } from '../text'
