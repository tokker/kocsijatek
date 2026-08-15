import type { Rng } from '../core/rng'

export interface HasChoices {
  choices: { en: string[]; hu?: string[] }
  correctIndex: number
}

/**
 * Megkeveri egy feleletválasztós feladat válaszlehetőségeit.
 *
 * A feladatbankban a helyes válasz helye erősen torzít: a zászlóknál a
 * megfejtések 89%-a a második vagy harmadik helyen áll, a triviánál 79%.
 * Keverés nélkül tehát az a csapat, amelyik semmit sem tud, de mindig a
 * középső gombot nyomja, tisztességes pontszámot ér el — a rossz tipp
 * fizet, ami pontosan az ellenkezője a játék céljának.
 *
 * A keverés az `rng`-ből jön, tehát determinisztikus: MINDKÉT autó
 * ugyanabban a sorrendben kapja a válaszokat, különben a pontszámaik
 * összehasonlíthatatlanok lennének.
 */
export function shuffleChoices<T extends HasChoices>(item: T, rng: Rng): T {
  const order = rng.shuffle(item.choices.en.map((_, index) => index))
  const reorder = (list?: string[]) =>
    list && list.length === order.length ? order.map((index) => list[index]) : list

  return {
    ...item,
    choices: {
      en: order.map((index) => item.choices.en[index]),
      hu: reorder(item.choices.hu),
    },
    // A helyes válasz a keverés UTÁN ide került.
    correctIndex: order.indexOf(item.correctIndex),
  }
}
