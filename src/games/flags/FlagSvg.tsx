/**
 * Zászlórajzoló néhány geometriai alapmintából.
 *
 * Szándékosan csak olyan zászlók kerülnek a játékba, amiket ezekkel a
 * primitívekkel PONTOSAN meg lehet rajzolni. Címeres zászlót inkább nem
 * veszünk fel, mint hogy pontatlanul rajzoljuk — egy félresikerült
 * címer értelmetlenné tenné a kérdést.
 *
 * Nincs letöltött kép: nulla licenckérdés, nulla hálózati forgalom,
 * és alagútban is megjelenik.
 */

export type FlagSpec =
  | { kind: 'horizontal'; colors: string[]; weights?: number[] }
  | { kind: 'vertical'; colors: string[]; weights?: number[] }
  | { kind: 'nordic'; field: string; cross: string; inner?: string }
  | { kind: 'swissCross'; field: string; cross: string }
  | { kind: 'disc'; field: string; disc: string; discX?: number }
  | { kind: 'bandsDisc'; colors: string[]; weights?: number[]; disc: string }

const W = 90
const H = 60

function bandRects(colors: string[], weights: number[] | undefined, vertical: boolean) {
  const w = weights ?? colors.map(() => 1)
  const total = w.reduce((sum, value) => sum + value, 0)
  const span = vertical ? W : H
  let offset = 0

  return colors.map((color, index) => {
    const size = (w[index] / total) * span
    const rect = vertical
      ? { x: offset, y: 0, width: size, height: H }
      : { x: 0, y: offset, width: W, height: size }
    offset += size
    return <rect key={index} fill={color} {...rect} />
  })
}

function NordicCross({ field, cross, inner }: { field: string; cross: string; inner?: string }) {
  // A függőleges szár a bal harmadban áll, nem középen — ez a
  // skandináv kereszt megkülönböztető jegye.
  const arm = (color: string, thickness: number) => {
    const half = thickness / 2
    return (
      <>
        <rect x={0} y={H / 2 - half} width={W} height={thickness} fill={color} />
        <rect x={W / 3 - half} y={0} width={thickness} height={H} fill={color} />
      </>
    )
  }

  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={field} />
      {arm(cross, 10)}
      {inner && arm(inner, 4)}
    </>
  )
}

export function FlagSvg({ spec, className }: { spec: FlagSpec; className?: string }) {
  const square = spec.kind === 'swissCross'
  const viewBox = square ? `0 0 ${H} ${H}` : `0 0 ${W} ${H}`

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label="Flag"
      preserveAspectRatio="xMidYMid meet"
    >
      {spec.kind === 'horizontal' && bandRects(spec.colors, spec.weights, false)}
      {spec.kind === 'vertical' && bandRects(spec.colors, spec.weights, true)}

      {spec.kind === 'nordic' && (
        <NordicCross field={spec.field} cross={spec.cross} inner={spec.inner} />
      )}

      {spec.kind === 'swissCross' && (
        <>
          <rect x={0} y={0} width={H} height={H} fill={spec.field} />
          <rect x={15} y={24} width={30} height={12} fill={spec.cross} />
          <rect x={24} y={15} width={12} height={30} fill={spec.cross} />
        </>
      )}

      {spec.kind === 'disc' && (
        <>
          <rect x={0} y={0} width={W} height={H} fill={spec.field} />
          <circle cx={spec.discX ?? W / 2} cy={H / 2} r={17} fill={spec.disc} />
        </>
      )}

      {spec.kind === 'bandsDisc' && (
        <>
          {bandRects(spec.colors, spec.weights, false)}
          <circle cx={W / 2} cy={H / 2} r={12} fill={spec.disc} />
        </>
      )}

      {/* Vékony keret, hogy a fehér mezős zászlók is elváljanak a háttértől. */}
      <rect
        x={0}
        y={0}
        width={square ? H : W}
        height={H}
        fill="none"
        stroke="rgba(148,163,184,0.5)"
        strokeWidth={1}
      />
    </svg>
  )
}
