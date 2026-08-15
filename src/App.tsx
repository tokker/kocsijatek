import { useEffect, useState } from 'react'
import { LanguageProvider, LANGUAGES, useT } from './i18n'
import { JoinScreen } from './screens/JoinScreen'
import { RoomScreen } from './screens/RoomScreen'
import { useSession } from './state/session'
import { getSyncAdapter, type SyncAdapter } from './sync'

export default function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  )
}

function Shell() {
  const [adapter, setAdapter] = useState<SyncAdapter | null>(null)
  const { session, setSession, clearSession } = useSession()

  // Az adapter kiválasztása aszinkron, mert a Firebase változatot csak
  // akkor töltjük be, ha tényleg arra van szükség.
  useEffect(() => {
    getSyncAdapter().then(setAdapter)
  }, [])

  if (!adapter) {
    return <div className="flex h-full items-center justify-center text-slate-400">…</div>
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <JoinScreen adapter={adapter} onJoined={setSession} />
        </div>
        <LanguagePicker />
      </div>
    )
  }

  return <RoomScreen adapter={adapter} session={session} onLeave={clearSession} />
}

/**
 * Nyelvváltó. Az induló verzió angol, de a váltó már most itt van: a
 * magyar fordítás hozzáadása így tartalomszerkesztés lesz, nem kódolás.
 */
function LanguagePicker() {
  const { language, setLanguage } = useT()
  return (
    <div className="flex justify-center gap-2 p-4">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`rounded-lg px-3 py-1 text-sm ${
            language === code ? 'bg-slate-700 text-slate-100' : 'text-slate-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
