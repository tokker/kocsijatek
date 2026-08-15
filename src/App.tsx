import { useEffect, useState } from 'react'
import { JoinScreen } from './screens/JoinScreen'
import { RoomScreen } from './screens/RoomScreen'
import { useSession } from './state/session'
import { getSyncAdapter, type SyncAdapter } from './sync'

export default function App() {
  const [adapter, setAdapter] = useState<SyncAdapter | null>(null)
  const { session, setSession, clearSession } = useSession()

  // Az adapter kiválasztása aszinkron, mert a Firebase változatot csak
  // akkor töltjük be, ha tényleg arra van szükség.
  useEffect(() => {
    getSyncAdapter().then(setAdapter)
  }, [])

  if (!adapter) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>
  }

  if (!session) {
    return <JoinScreen adapter={adapter} onJoined={setSession} />
  }

  return <RoomScreen adapter={adapter} session={session} onLeave={clearSession} />
}
