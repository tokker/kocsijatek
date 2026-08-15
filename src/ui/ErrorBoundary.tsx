import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Kilépés a szobából: az utolsó mentsvár, ha a mentett munkamenet a hibás. */
  onReset: () => void
}

interface State {
  error: Error | null
}

/**
 * Ha renderelés közben kivétel repül, a React leszereli a TELJES fát, és
 * a képernyő feketén marad. Egy autóban ez a legrosszabb végkimenetel:
 * nincs konzol, nincs fejlesztői eszköz, és az app minden újratöltés után
 * ugyanoda esik vissza, mert a hibás állapot a localStorage-ban van.
 *
 * Ez a határ nem javítja meg a hibát — azt a `normalize.ts` végzi —, csak
 * gondoskodik róla, hogy egyetlen kivétel se legyen ismét visszafordíthatatlan:
 * megnevezi a hibát, és ad egy utat kifelé a szobából.
 *
 * A szövegek szándékosan NEM az i18n-ből jönnek. A fordítási réteg maga is
 * lehet a hiba forrása, és egy hibaképernyő, ami elszáll, semmit sem ér.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[roadtrip] render failed', error)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-5xl">🚧</p>
        <h1 className="text-xl font-bold">Something broke</h1>
        <p className="text-sm text-slate-400">
          The game hit an error and stopped. Your scores are safe on the server — rejoining
          with the same room code puts you back where you were.
        </p>
        <p className="max-w-full overflow-x-auto rounded-xl bg-slate-800 p-3 font-mono text-xs text-slate-400">
          {error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-12 w-full max-w-xs rounded-2xl bg-slate-700 text-lg font-bold"
        >
          Try again
        </button>
        <button
          onClick={() => {
            this.props.onReset()
            window.location.reload()
          }}
          className="text-sm text-slate-500 underline"
        >
          Leave the room and start over
        </button>
      </div>
    )
  }
}
