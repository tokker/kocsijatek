// A jest-dom matcherek csak jsdom alatt értelmesek. Node környezetben a
// document nem létezik, ezért ott kihagyjuk a betöltést — így a tiszta
// logikai tesztek nem fizetik meg a böngészőkörnyezet árát.
if (typeof document !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')
}
