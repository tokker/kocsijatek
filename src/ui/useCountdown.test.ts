// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts at the full duration', () => {
    const { result } = renderHook(() => useCountdown(10, () => {}))
    expect(result.current.secondsLeft).toBe(10)
  })

  it('counts down', () => {
    const { result } = renderHook(() => useCountdown(10, () => {}))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.secondsLeft).toBe(7)
  })

  it('fires the callback exactly once at zero', () => {
    const onExpire = vi.fn()
    renderHook(() => useCountdown(2, onExpire))
    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('never goes below zero', () => {
    const { result } = renderHook(() => useCountdown(2, () => {}))
    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(result.current.secondsLeft).toBe(0)
  })

  it('does not restart when the callback identity changes', () => {
    const { result, rerender } = renderHook(({ cb }) => useCountdown(10, cb), {
      initialProps: { cb: () => {} },
    })
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    rerender({ cb: () => {} })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    // 5 másodperc telt el összesen; ha újraindult volna, 9-et mutatna.
    expect(result.current.secondsLeft).toBe(5)
  })

  it('reports elapsed time', () => {
    const { result } = renderHook(() => useCountdown(10, () => {}))
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(result.current.elapsedMs()).toBe(2500)
  })

  it('stops ticking after unmount', () => {
    const onExpire = vi.fn()
    const { unmount } = renderHook(() => useCountdown(2, onExpire))
    unmount()
    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(onExpire).not.toHaveBeenCalled()
  })
})
