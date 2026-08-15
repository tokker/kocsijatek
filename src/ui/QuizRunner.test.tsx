// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuizRunner } from './QuizRunner'

interface Item {
  prompt: string
  choices: string[]
  correctIndex: number
}

const items: Item[] = [
  { prompt: 'Q1', choices: ['a', 'b'], correctIndex: 0 },
  { prompt: 'Q2', choices: ['c', 'd'], correctIndex: 1 },
]

function setup(overrides: Partial<React.ComponentProps<typeof QuizRunner<Item>>> = {}) {
  const onComplete = vi.fn()
  render(
    <QuizRunner<Item>
      items={items}
      durationSec={600}
      revealMs={0}
      renderPrompt={(item) => <p>{item.prompt}</p>}
      getChoices={(item) => item.choices}
      isCorrect={(item, choiceIndex) => choiceIndex === item.correctIndex}
      onComplete={onComplete}
      {...overrides}
    />,
  )
  return onComplete
}

describe('QuizRunner', () => {
  it('shows the first prompt', () => {
    setup()
    expect(screen.getByText('Q1')).toBeInTheDocument()
  })

  it('does not mark the correct answer in the DOM before answering', () => {
    setup()
    // Csalásvédelem: a forrásból nem szabad kiolvashatónak lennie.
    expect(document.body.innerHTML).not.toMatch(/correct|data-answer|bg-green/i)
  })

  it('advances to the next item after an answer', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'a' }))
    expect(await screen.findByText('Q2')).toBeInTheDocument()
  })

  it('reports results once every item is answered', async () => {
    const onComplete = setup()
    await userEvent.click(screen.getByRole('button', { name: 'a' })) // helyes
    await userEvent.click(await screen.findByRole('button', { name: 'c' })) // helytelen
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ items: [true, false], rawScore: '1 / 2' }),
    )
  })

  it('normalises a perfect run to the top of the shared scale', async () => {
    const onComplete = setup()
    await userEvent.click(screen.getByRole('button', { name: 'a' }))
    await userEvent.click(await screen.findByRole('button', { name: 'd' }))
    expect(onComplete.mock.calls[0][0].points).toBe(1000)
  })

  it('gives zero for an entirely wrong run', async () => {
    const onComplete = setup()
    await userEvent.click(screen.getByRole('button', { name: 'b' }))
    await userEvent.click(await screen.findByRole('button', { name: 'c' }))
    expect(onComplete.mock.calls[0][0].points).toBe(0)
  })

  it('applies per-item weights', async () => {
    // A második kérdés háromszoros súlyú: csak azt eltalálva 3/4 az arány.
    const onComplete = setup({ weightOf: (_item, i) => (i === 1 ? 3 : 1) })
    await userEvent.click(screen.getByRole('button', { name: 'b' })) // rossz, súly 1
    await userEvent.click(await screen.findByRole('button', { name: 'd' })) // jó, súly 3
    expect(onComplete.mock.calls[0][0].points).toBe(750)
  })

  it('locks every choice while the answer is revealed', async () => {
    // revealMs > 0 kell hozzá: nullánál azonnal továbblép, és a
    // gombhivatkozás már a következő kérdéshez tartozna.
    setup({ revealMs: 400 })
    await userEvent.click(screen.getByRole('button', { name: 'a' }))

    // A visszajelzés alatt egyik gomb sem nyomható: nincs javítási lehetőség.
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()

    expect(await screen.findByText('Q2')).toBeInTheDocument()
  })

  it('records the first answer even if the item is tapped again', async () => {
    const onComplete = setup()
    await userEvent.click(screen.getByRole('button', { name: 'a' }))
    await userEvent.click(await screen.findByRole('button', { name: 'c' }))
    expect(onComplete.mock.calls[0][0].items).toEqual([true, false])
  })

  it('shows progress and a clock', () => {
    setup()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
  })

  it('completes immediately when there are no items', () => {
    const onComplete = setup({ items: [] })
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ points: 0, rawScore: '0 / 0', items: [] }),
    )
  })
})
