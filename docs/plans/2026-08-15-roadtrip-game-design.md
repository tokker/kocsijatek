# Road Trip Game — tervdokumentum

**Dátum:** 2026-08-15
**Állapot:** jóváhagyva, implementációra vár

---

## 1. Cél

Telefonról használható webes játékoldal, amivel két (vagy több) autóban utazó
baráti társaság versenyezhet egymással egy hosszú, ~12 órás út alatt.

Minden autó egy **csapat**. A játék **15 perces körökre** oszlik, körönként egy
játéktípussal. A csapatok ugyanazokat a feladatokat kapják, így a pontszámuk
közvetlenül összehasonlítható.

Nyelv: az induló verzió angol. A magyar fordítás később jön, kódmódosítás nélkül.

## 2. A kör-kapu — a rendszer központi mechanizmusa

Ez a legfontosabb követelmény, ezért külön szakaszt kap.

- Az **N. kör akkor nyílik ki**, ha az `(N-1)`. körben **minden** csapatnak van
  lezárt eredménye.
- Ha kinyílt, **minden csapat maga dönti el, mikor nyom Startot**. Ha az egyik
  autó megáll pihenni vagy tankolni, később kezdi a kört — a másik ettől még nem
  léphet tovább a következőre.
- Aki végzett, **várakozó képernyőre** kerül, ami élőben mutatja a másik csapat
  állapotát: `még nem kezdte el` / `játszik, 6:12 eltelt` / `végzett`.
- A csapatlista dinamikus, ezért a rendszer **3-4 autóval is működik** bármilyen
  kódmódosítás nélkül.

## 3. Architektúra

Statikus PWA, minden játéktartalommal a bundle-ben; a hálózat csak a
csapatállapotot mozgatja (~1 KB / kör).

```
React + TypeScript + Vite + Tailwind  →  Cloudflare Pages (ingyenes)
                ↕
       Firebase Realtime Database (ingyenes Spark tier)
                ↕
  vite-plugin-pwa → telefonra telepíthető, offline is fut
```

**Miért nem Next.js + Supabase:** a Supabase free tier inaktivitás után
felfüggeszti a projektet, és felesleges szerveroldali réteget hozna be.
**Miért nem peer-to-peer (WebRTC):** mobilhálózaton a NAT-átjárás megbízhatatlan
— pont akkor bukna el, amikor kell.

**Offline viselkedés:** a Firebase SDK sorba állítja az írásokat hálózatvesztéskor,
és visszatéréskor elküldi őket. Egy alagút tehát nem veszít adatot, csak késlelteti.
A UI-nak ezt **külön jeleznie kell** (`offline — szinkronizálásra vár`), hogy ne
tűnjön úgy, mintha a másik autó lassú lenne.

## 4. Adatmodell (Firebase Realtime Database)

```
rooms/{roomCode}/
  meta:  { roundSeconds, currentRound, gameSchedule: [{ round, gameId, seed }] }
  teams: { [teamId]: { name, color, emoji, joinedAt } }
  rounds/{roundNumber}/
    started/{teamId}: <timestamp>
    done/{teamId}:    { points, rawScore, timeMs, items: boolean[] }
```

A `seed` biztosítja, hogy mindkét csapat **ugyanazt a feladatsort ugyanabban a
sorrendben** kapja. Enélkül a pontszámok nem összehasonlíthatók.

## 5. Pontozás

Minden játék két értéket ad vissza:

- **rawScore** — a játék saját mértéke (pl. `23/30 helyes`)
- **points** — 0–1000-re normalizálva, hogy a különböző játéktípusok
  összemérhetők legyenek

A kör nyertese **+200 bónuszt** kap.

### 5.1 Csalásbiztonság — kötelező szabály minden játékra

> **Egy játék csak akkor kerülhet a versenybe, ha az app tudja a helyes választ
> még azelőtt, hogy a csapat válaszol.**

Ebből következik:
- Senki nem tud magának pontot beírni.
- Senki nem tudja a másik csapatot szándékosan lepontozni — nincs emberi bíráló.
- A helyes válasz **csak a válasz rögzítése után** kerülhet a képernyőre és a
  DOM-ba. A feladatsort futásidőben, feladatonként bontjuk ki, hogy a
  forráskódból se legyen kiolvasható.
- Feladaton belül **nincs visszalépés**; a válasz rögzítése végleges.

### 5.2 Honor Round mód (később)

Kilenc ötlet emberi ítéleten alapul (Taboo, dúdolós, DJ Duel, Story Chain,
Két igazság egy hazugság, Scavenger Hunt, rendszámbingó, Trip Predictions,
Most Likely To). Ezek egy külön, **nem pontozott** módba kerülnek, ami
egyértelműen jelzi, hogy nem számít az állásba. Csak az alaprendszer elkészülte
után épül meg, és csak ha igény van rá.

## 6. Összehasonlító képernyő

A kör után, ha minden csapat végzett:

- egymás melletti pontsáv és összesített állás
- **feladatonkénti rács**: zöld/piros négyzetek csapatonként egymás alatt, tehát
  látszik, *melyik* feladatnál dőlt el a kör
- **a kör fordulópontja**: az a feladat, ahol a legnagyobb volt a különbség
- felhasznált idő csapatonként
- trendgrafikon: körről körre ki vezetett

## 7. Játékmodul-interfész

Minden játék **egy fájl**, ami egy közös interfészt valósít meg:

```ts
interface GameModule {
  id: string
  durationSec: number
  buildRound(seed: string): RoundData   // determinisztikus feladatsor
  Component: React.FC<GameProps>        // a játék képernyője
  score(answers: Answer[]): GameResult  // { points, rawScore, items }
}
```

Új játék hozzáadása így **nem nyúl a motorhoz** — csak egy új fájl és egy sor a
regiszterben.

## 8. Induló játékkészlet (mind gépi pontozású)

| # | Játék | 15 perces formátum | Pontozás alapja |
|---|---|---|---|
| 1 | Rapid Trivia | 30 kérdés, 25 mp/db, utolsó 5 dupla | válaszkulcs |
| 2 | Wager Round | 10 kérdés, mindegyik előtt tét | válaszkulcs + tét |
| 3 | Closest Wins | 15 számtipp | eltérés a valós értéktől |
| 4 | Zoom Reveal | 12 kizoomoló SVG | válaszkulcs + zoom-szint |
| 5 | Flag & Silhouette | 25 zászló/körvonal | válaszkulcs |
| 6 | Emoji Decode | 20 emoji-rejtvény | válaszkulcs |
| 7 | Anagram Rush | 60 mp-es blokkok | válaszkulcs |
| 8 | Letter Blitz | 6× (betű + zárt kategória), 90 mp | beépített szólista + egyediség |
| 9 | Brain Arcade | 4 kihívás, körbejáró telefon | a telefon mér |
| 10 | Word Grid | növekvő betűrácsok | az app ismeri a megoldást |

**Letter Blitz részletei:** csak **zárt, teljes listájú** kategóriák
használhatók (országok, fővárosok, állatok, autómárkák, kémiai elemek,
focicsapatok) — ezek teljes listája becsomagolható. Az egyediség-bónusz:
amit mindkét autó leírt = 1 pont, amit csak az egyik = 3 pont. Ez tisztán
string-összehasonlítás, nem ítélkezés.

**Brain Arcade részletei:** reakcióidő, Stroop-teszt, 1–25 tapizás,
fejszámolás. A telefon körbejár, mindenki lefut egy kört, az eredmények
összeadódnak.

### 8.1 Későbbi bővítés

További ~15 gépi pontozású típus vár a sorban: True/False Blitz, Odd One Out,
Higher or Lower, Category Ladder, Missing Vowels, Before & After, Word Chain,
Rebus, Spot the Odd Color, Simon Says, Reaction Tap külön játékként,
Math Sprint, Stroop külön, Number Rush, Lyric Finish (feleletválasztós).

Cél: 25+ pontozott típus. 12 óra / 15 perc = max. 48 kör, tehát típusonként
2-3 menetnyi tartalom kell.

## 9. Képi tartalom

Nem töltünk le szerzői jog alá eső képeket. Minden vizuális feladat **generált**:

- SVG zászlók (public domain)
- sziluettek és körvonalak
- emoji-rebuszok
- algoritmikusan generált színrácsok és minták

Előny: nulla licenckérdés, nulla hálózati forgalom, végtelen variáció.

## 10. Nyelvkezelés

Minden felületi szöveg és minden feladat `{ en, hu }` alakban áll a
tartalomfájlokban, kezdettől fogva. Most csak az `en` kitöltött. A nyelvváltó
gomb már az első verzióban ott van. A magyar hozzáadása később **tartalomszerkesztés,
nem kódolás**.

## 11. Tesztelhetőség

- **Turbo mód** — a körhossz fejlesztői kapcsolóval 15 perc helyett 60 mp
- **Két böngészőfül = két autó** — élőben látszik a kör-kapu működése
- **„Másik autó szimulálása" gomb** — egyedül is végigjátszható a teljes kör
- **Mock hálózati adapter** — `localStorage` alapon, Firebase projekt nélkül is
  indul; ugyanazt az interfészt implementálja, mint az éles adapter

## 12. Hosting

| Réteg | Megoldás | Költség |
|---|---|---|
| weboldal | Cloudflare Pages (vagy Netlify / GitHub Pages) | ingyenes |
| szinkron | Firebase Realtime Database, Spark tier | ingyenes |

A Firebase projektet a felhasználó hozza létre saját Google-fiókkal; a fejlesztés
addig a mock adapterrel folyik, hogy ne legyen blokkoló.

## 13. Nyitott kérdések

- A `roomCode` formátuma és a szoba élettartama (várhatóan 4-6 karakter, 24 óra)
- Kell-e a Honor Round mód egyáltalán
- Kell-e körönként a játéktípus előre látszania, vagy legyen meglepetés
