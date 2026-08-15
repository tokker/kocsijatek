import { useCallback, useState } from 'react'

/**
 * A localStorage origin-onként közös, nem fülönként. A szobaadatoknál ez
 * pont kell (így szimulálja a szervert), a munkamenetnél viszont azt
 * okozná, hogy két böngészőfül ugyanannak a csapatnak hiszi magát.
 *
 * A `?car=2` query paraméter külön névteret ad, hogy egyetlen gépen két
 * csapattal lehessen végigpróbálni a köröket. Élesben, paraméter nélkül
 * a viselkedés változatlan.
 */
function storageKey(): string {
  const suffix = new URLSearchParams(window.location.search).get('car')
  return suffix ? `roadtrip:session:${suffix}` : 'roadtrip:session'
}

export interface Session {
  roomCode: string
  teamId: string
  teamName: string
  emoji: string
  colorIndex: number
}

function read(): Session | null {
  try {
    const raw = localStorage.getItem(storageKey())
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

/**
 * A csapatazonosító és a szobakód localStorage-ban él. Ez nem kényelmi
 * kérdés: egy rázkódó autóban a képernyő véletlen frissítése tényleg meg
 * fog történni, és enélkül a csapat kiesne a játékból a kör közepén.
 */
export function useSession() {
  const [session, setSessionState] = useState<Session | null>(read)

  const setSession = useCallback((next: Session) => {
    localStorage.setItem(storageKey(), JSON.stringify(next))
    setSessionState(next)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(storageKey())
    setSessionState(null)
  }, [])

  return { session, setSession, clearSession }
}

/** Rövid, ütközésmentes csapatazonosító. */
export function generateTeamId(): string {
  return `team-${crypto.randomUUID().slice(0, 8)}`
}
