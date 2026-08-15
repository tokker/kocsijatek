# Road Trip Game

Telefonról használható webes játék, amivel két (vagy több) autóban utazó
társaság versenyezhet egymással egy hosszú úton.

Minden autó egy **csapat**. A játék **15 perces körökre** oszlik, körönként egy
játékkal. Mindkét csapat ugyanazokat a feladatokat kapja, ezért a pontszámuk
közvetlenül összehasonlítható.

**A központi szabály:** a következő kör csak akkor nyílik ki, ha az előzőt
**minden csapat** befejezte. Az, hogy ki mikor *kezdte*, közömbös — az egyik
autó megállhat tankolni vagy pihenni, és később kezdheti a kört anélkül, hogy a
másik elhúzna mellette.

---

## Gyors indítás

```bash
npm install
```

```bash
npm run dev
```

## Tesztelés egy gépen, két csapattal

Nyisd meg két böngészőfülön:

- `http://localhost:5173`
- `http://localhost:5173/?car=2`

A `?car=2` paraméter kell a második fülhöz. A böngésző tárolója **origin-onként
közös, nem fülönként**, e nélkül a második fül ugyanannak a csapatnak hinné
magát. Telefonokon nincs rá szükség.

Szoba létrehozásakor pipáld be a **Turbo rounds** kapcsolót (csak fejlesztői
módban látszik): így 15 perc helyett 60 másodperc egy kör.

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `npm run dev` | fejlesztői szerver |
| `npm test` | a teljes tesztkészlet |
| `npm run typecheck` | típusellenőrzés |
| `npm run build` | éles csomag a `dist/` mappába |
| `node scripts/make-icons.mjs` | PWA ikonok újragenerálása |

---

## Firebase

A `.env.local` fájl tartalmazza a kapcsolódási adatokat (a minta a
`.env.example`). Verziókövetésbe nem kerül.

### Biztonsági szabályok

> **Fontos, indulás előtt ellenőrizd.** A Firebase „test mode" alapértelmezett
> szabálya **30 nap után lejár**, és onnantól minden írást elutasít. Ha ez út
> közben történik meg, a játék némán megáll: a körök nem záródnak le, és a
> kapu véglegesen zárva marad.

A Realtime Database → **Rules** fülön ezt érdemes beállítani helyette:

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

Ez bárkinek engedi az írást, aki ismeri a négy karakteres szobakódot. Egy
baráti játékhoz ez arányos: nincs benne személyes adat, és a kódot csak ti
ismeritek. Nincs benne lejárat, tehát út közben nem áll meg.

Ha szigorúbbat szeretnél, a következő lépés a Firebase **Anonymous Auth**
bekapcsolása és `"auth != null"` hozzáadása a `.write` feltételhez.

---

## Publikálás — Cloudflare (ingyenes)

A repó GitHubon van, a Cloudflare pedig minden pushra újraépíti. Build
parancs: `npm run build`, kimeneti könyvtár: `dist`.

**A Firebase-beállítások a verziókövetett `.env.production` fájlban vannak**,
nem a Cloudflare felületén. Ez szándékos:

> A Vite a `VITE_` változókat **build időben** égeti bele a JavaScript
> csomagba, nem futásidőben olvassa. Egy Worker futásidejű változója tehát
> soha nem érne el a böngészőig — a beállításnak a fordításkor kell ott
> lennie. A repóba téve ez magától megoldódik, és nem lehet elfelejteni.

A Firebase webes konfiguráció nem titok: nem jogosultságot ad, csak azonosítja
a projektet, és a böngészőnek amúgy is ki kell szolgálni — bárki megnézheti a
kiszolgált csomagban. A tényleges védelmet a **szabályok** adják, lásd fentebb.

A `.env.local` továbbra sincs verziókövetve, és fejlesztéskor az érvényes.

### Ha mégis mock módban indulna

Ha az oldal tetején narancssárga sáv jelenik meg („Other devices will not see
this game"), akkor a build nem látta a beállításokat, és az app csak a saját
böngészőjében tárol. Ilyenkor két fül ugyanazon a gépen látja egymást, két
külön telefon viszont soha. A sáv megnevezi, melyik változó hiányzik.

## Indulás előtti teendők

- [ ] A Firebase szabályok lejárat nélküliek (lásd fent)
- [ ] Mindenki megnyitja a linket telefonon
- [ ] Mindenki kiteszi a kezdőképernyőre („Hozzáadás a kezdőképernyőhöz")

Az utolsó lépés a legfontosabb: ekkor tölti le a service worker a teljes
tartalmat, és onnantól az app **térerő nélkül, alagútban is elindul**. A
körök végigjátszhatók offline; az eredmény akkor megy fel, amikor visszatér a
hálózat, és a felület addig `Offline — will sync later` állapotot mutat.

---

## A tíz játék

| Játék | Mi a feladat | Miből jön a pont |
|---|---|---|
| 🧠 Rapid Trivia | 30 kérdés, az utolsó öt dupla | válaszkulcs |
| 🎬 Emoji Decode | filmek és könyvek emojiból | válaszkulcs |
| 🚩 Flag Quiz | melyik ország zászlaja | válaszkulcs |
| 🎯 Closest Wins | számtippek | eltérés a valóstól, tűréshatárral |
| 🎲 Wager Round | igaz/hamis, megjelölt téttel | tét ×1/×2/×3, rossz válasz levon |
| 🔤 Anagram Rush | kevert betűkből szó | pontos egyezés |
| 🔍 Flag Zoom | zászló apró részletből | minél korábbi tipp, annál több |
| 🔡 Word Grid | rejtett szavak betűrácsban | megtalált szavak |
| ⚡ Brain Arcade | négy mért kihívás | a telefon mér időt és találatot |
| 🔠 Letter Blitz | adott betűs szavak gyűjtése | beépített lista + egyediség-bónusz |

**Mind a tíz gépi pontozású.** Ez tervezési szabály, nem véletlen: egy játék
csak akkor kerülhet a versenybe, ha az app tudja a helyes választ még azelőtt,
hogy a csapat válaszol. Így senki nem tud magának pontot beírni, és senki nem
tudja a másikat szándékosan lehúzni.

---

## Fejlesztés

### Új játék hozzáadása

Egy fájl és egy sor. A modul a `GameModule` interfészt valósítja meg
(`src/games/types.ts`), a regiszterbe pedig `src/games/registry.ts` alá kerül.
A motor, a szinkron és a képernyők nem változnak.

Minden regisztrált játékra automatikusan lefut két tesztkészlet:

- `src/games/gameContract.test.tsx` — determinizmus, emelkedő nehézség, a
  válasz nem szivárog ki a DOM-ba, és **mindig jelent eredményt, amikor lejár a
  kör órája**. Ez utóbbi a legfontosabb: egy játék, ami sosem hívja meg az
  `onComplete`-et, nemcsak a saját csapatát akasztaná meg, hanem a kör-kapun
  keresztül a másik autót is.
- `src/games/choicePools.test.ts` — a feleletválasztós készletek tartalmi
  szabályai

### Nehézségi szintek

Nincs „easy" szint, és ezt teszt is őrzi. A közönség művelt huszonévesekből
áll; ha mindkét autó közel maximumot ér el, a pontszámok nem szóródnak, és a
kör gyakorlatilag döntetlen lesz. A cél, hogy egy jó csapat is 60–70% körül
teljesítsen.

Egy kör emelkedő sorrendben halad (`medium` → `hard` → `brutal`), így a dupla
pontot érő záró feladatok a legnehezebbek közül kerülnek ki, és a kör a
hajrában dőlhet el.

### Magyar fordítás

`src/i18n/hu.ts` — jelenleg üres. A kulcsok az `src/i18n/en.ts` fájlban vannak;
elég ide átmásolni és lefordítani őket, a nyelvváltó már működik. A hiányzó
kulcsok automatikusan az angolra esnek vissza, tehát részlegesen kitöltve is
használható marad.

A feladatok szövege a játékok saját tartalomfájljaiban ül, `{ en, hu }`
alakban — például `src/games/trivia/questions.en.ts`.

### Tervdokumentumok

- [Tervdokumentum](docs/plans/2026-08-15-roadtrip-game-design.md) — mi miért így
  működik
- [Implementációs terv](docs/plans/2026-08-15-roadtrip-game-implementation.md)
