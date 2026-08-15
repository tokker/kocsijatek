import { useEffect, useRef, useState } from 'react'

/**
 * Wall-clock alapú visszaszámláló.
 *
 * Szándékosan a Date.now() a forrás, nem a lefutott tick-ek száma: amikor
 * a telefon képernyője lezár vagy az app háttérbe kerül, a böngésző
 * lefojtja a setInterval-t. Tick-számlálással a 15 perces kör 20 perccé
 * nyúlna, ha valaki közben megnézi az üzeneteit — wall clockkal nem.
 */
export function useCountdown(durationSec: number, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(durationSec)
  const startedAt = useRef(Date.now())
  const fired = useRef(false)

  // Refben tartjuk, hogy egy újra létrehozott callback ne indítsa újra
  // az intervallumot — az visszaállítaná a visszaszámlálást.
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

  return {
    secondsLeft,
    elapsedMs: () => Date.now() - startedAt.current,
  }
}
