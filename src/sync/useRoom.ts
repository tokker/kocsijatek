import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
import { isRoundUnlocked, teamRoundStatus, teamsStillPlaying } from '../core/roundGate'
import { standings } from '../core/scoring'
import type { GameResult, RoomState, TeamId } from '../core/types'

export function useRoom(adapter: SyncAdapter, roomCode: string, myTeamId: TeamId) {
  const [state, setState] = useState<RoomState | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => adapter.subscribe(roomCode, setState), [adapter, roomCode])
  useEffect(() => adapter.subscribeStatus(setStatus), [adapter])

  /**
   * Az aktuális kör a legkisebb olyan sorszám, amit még nem fejezett be
   * mindenki. Ez LEVEZETETT érték, nem tárolt — ezért két eszköz sosem
   * kerülhet ellentmondásba egymással: ugyanabból az adatból mindkettő
   * ugyanazt számolja ki.
   */
  const currentRound = useMemo(() => {
    if (!state) return 1
    let round = 1
    while (isRoundUnlocked(state, round + 1)) round++
    return round
  }, [state])

  const myStatus = state ? teamRoundStatus(state, currentRound, myTeamId) : 'not-started'
  const table = useMemo(() => (state ? standings(state) : []), [state])

  /**
   * Azok a csapatok, akik ENGEM blokkolnak. Szándékosan üres, amíg én
   * magam sem végeztem: egy frissen megnyílt kör elején mindenki
   * "még nem végzett", de ilyenkor várakozásról beszélni félrevezető.
   */
  const waitingFor = useMemo(
    () =>
      state && myStatus === 'done'
        ? teamsStillPlaying(state, currentRound).filter((t) => t.id !== myTeamId)
        : [],
    [state, currentRound, myTeamId, myStatus],
  )

  const start = useCallback(
    () => adapter.markStarted(roomCode, currentRound, myTeamId),
    [adapter, roomCode, currentRound, myTeamId],
  )

  const submitResult = useCallback(
    (result: GameResult) => adapter.submitResult(roomCode, currentRound, myTeamId, result),
    [adapter, roomCode, currentRound, myTeamId],
  )

  return {
    state,
    status,
    currentRound,
    myStatus,
    /** Elindíthatom-e most a kört? Csak akkor, ha még nem játszottam le. */
    canStart: myStatus === 'not-started',
    /** Kikre várunk még, mielőtt bárki továbbléphetne. */
    waitingFor,
    standings: table,
    schedule: state?.meta.schedule ?? [],
    currentGameId: state?.meta.schedule.find((s) => s.round === currentRound)?.gameId,
    currentSeed: state?.meta.schedule.find((s) => s.round === currentRound)?.seed,
    start,
    submitResult,
  }
}
