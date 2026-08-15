/**
 * A Tailwind a build során statikusan gyűjti ki az osztályneveket, ezért
 * `bg-car-${index}` formában NEM működne — a generált CSS-be be sem
 * kerülne. Ezért a teljes osztálynevek explicit módon szerepelnek itt.
 */
export const TEAM_COLORS = [
  { name: 'Red', bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500', border: 'border-red-500' },
  { name: 'Blue', bg: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500', border: 'border-blue-500' },
  { name: 'Green', bg: 'bg-green-500', text: 'text-green-400', ring: 'ring-green-500', border: 'border-green-500' },
  { name: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500', border: 'border-yellow-500' },
] as const

export const TEAM_EMOJIS = ['🚗', '🚙', '🚐', '🚕', '🏎️', '🚌'] as const

export function teamColor(index: number) {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}
