// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

afterEach(cleanup)

function Boom(): never {
  throw new Error('kaboom')
}

it('shows a way out instead of an empty screen when a render throws', () => {
  // A React a kivételt a konzolra is kiírja; itt ez csak zaj.
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    render(
      <ErrorBoundary onReset={vi.fn()}>
        <Boom />
      </ErrorBoundary>,
    )

    // A lényeg: a body NEM üres — pontosan ez különbözteti meg a fekete
    // képernyőtől, amit ez a határ megszüntet.
    expect(document.body.innerText !== '').toBe(true)
    expect(screen.getByText(/Something broke/)).toBeTruthy()
    expect(screen.getByText(/kaboom/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /leave the room/i })).toBeTruthy()
  } finally {
    consoleError.mockRestore()
  }
})

it('clears the stored session when the player chooses to start over', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  const onReset = vi.fn()
  // A jsdom nem tud navigálni; a reload csak zajt adna.
  const reload = vi.fn()
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload },
    writable: true,
  })

  try {
    render(
      <ErrorBoundary onReset={onReset}>
        <Boom />
      </ErrorBoundary>,
    )
    screen.getByRole('button', { name: /leave the room/i }).click()
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(reload).toHaveBeenCalledTimes(1)
  } finally {
    consoleError.mockRestore()
  }
})

it('renders its children untouched when nothing throws', () => {
  render(
    <ErrorBoundary onReset={vi.fn()}>
      <p>all good</p>
    </ErrorBoundary>,
  )
  expect(screen.getByText('all good')).toBeTruthy()
})
