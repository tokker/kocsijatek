import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ConnectionStatus, SyncAdapter } from './SyncAdapter'
import { currentRoundOf, teamRoundStatus, teamsStillPlaying } from '../core/roundGate'
import { standings } from '../core/scoring'
import type { GameResult, RoomState, TeamId } from '../core/types'

export function useRoom(adapter: SyncAdapter, roomCode: string, myTeamId: TeamId) {
  const [state, setState] = useState<RoomState | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => adapter.subscribe(roomCode, setState), [adapter, roomCode])
  useEffect(() => adapter.subscribeStatus(setStatus), [adapter])

  const currentRound = useMemo(() => (state ? currentRoundOf(state) : 1), [state])

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
