import { useState } from 'react'
import { apparentWind, boatSpeed, clamp, idealSailAngle, toRad, type Vec } from '../lib/sailing'
import { Boat } from '../components/svg/Boat'
import { Water, WaterDefs, WindArrow, WindField } from '../components/svg/Wind'
import { Meter } from '../components/svg/HeelGauge'
import { Segmented, Slider } from '../components/ui/controls'
import { Stepper, type Step } from '../components/ui/Stepper'
import { SimFrame } from './SimFrame'

export type KiteState = 'bag' | 'hoisting' | 'flying' | 'collapsed' | 'stalled' | 'gather'

/**
 * Top-down spinnaker on a boat pointing up (bow at −y). `pole` is degrees from the bow
 * towards the windward side; `side` is the windward side (1 = starboard, −1 = port).
 */
export function Kite({ pole, ease, state, side }: { pole: number; ease: number; state: KiteState; side: 1 | -1 }) {
  const mast: Vec = { x: 0, y: -10 }
  const p = toRad(pole)
  const tack = { x: side * Math.sin(p) * 40, y: mast.y - Math.cos(p) * 40 }
  const clew = { x: -side * (24 + 30 * ease), y: -40 + 26 * ease }
  const depth = state === 'flying' ? 62 : state === 'stalled' ? 40 : state === 'hoisting' ? 26 : 16
  const midX = (tack.x + clew.x) / 2
  const front = { x: midX, y: Math.min(tack.y, clew.y) - depth }
  const foot = { x: midX, y: Math.min(tack.y, clew.y) - depth * 0.3 }

  const sheetPt = { x: -side * 16, y: 44 }
  const guyPt = { x: side * 16, y: 44 }
  const showPole = state !== 'bag' && state !== 'gather'

  return (
    <g>
      {showPole && <line x1={mast.x} y1={mast.y} x2={tack.x} y2={tack.y} stroke="var(--ink)" strokeWidth={3.5} strokeLinecap="round" />}
      {state !== 'bag' && (
        <>
          <line x1={tack.x} y1={tack.y} x2={guyPt.x} y2={guyPt.y} stroke="var(--wind)" strokeWidth={1.5} opacity={0.8} />
          <line x1={clew.x} y1={clew.y} x2={sheetPt.x} y2={sheetPt.y} stroke="var(--signal)" strokeWidth={1.5} opacity={0.8} />
        </>
      )}
      {state === 'bag' ? (
        <rect x={-side * 22 - 6} y={-30} width={12} height={16} rx={4} fill="var(--signal)" />
      ) : state === 'collapsed' || state === 'gather' ? (
        <path
          d={`M${tack.x},${tack.y} q${(clew.x - tack.x) * 0.25},-14 ${(clew.x - tack.x) * 0.5},-4 t${(clew.x - tack.x) * 0.5},${clew.y - tack.y + 4}`}
          fill="var(--signal)"
          fillOpacity={0.55}
          stroke="var(--signal)"
          strokeWidth={2}
        />
      ) : (
        <path
          d={`M${tack.x},${tack.y} Q${front.x},${front.y} ${clew.x},${clew.y} Q${foot.x},${foot.y} ${tack.x},${tack.y} Z`}
          fill="var(--signal)"
          fillOpacity={0.9}
          stroke="#c2410c"
          strokeWidth={1.5}
        />
      )}
      {state === 'flying' && (
        <path d={`M${tack.x},${tack.y} q${-side * 6},-10 ${-side * 2},-22`} fill="none" stroke="white" strokeWidth={2} opacity={0.8} className="flutter" />
      )}
    </g>
  )
}

function useSpinnakerModel(twa: number, pole: number, ease: number) {
  const tws = 12
  const bs = boatSpeed(tws, twa)
  const aw = apparentWind(tws, twa, bs)
  const awa = Math.abs(aw.angle)
  const idealPole = clamp(awa - 90, 0, 90)
  const poleErr = pole - idealPole
  let state: KiteState = 'flying'
  let verdict = 'Luff just curling — perfect. Keep easing until it curls, then trim a touch.'
  let tone = 'var(--starboard)'
  if (ease > 0.82) {
    state = 'collapsed'
    verdict = 'Collapsed! Over-eased — the luff folded in. Trim the sheet quickly.'
    tone = 'var(--port)'
  } else if (ease < 0.45) {
    state = 'stalled'
    verdict = 'Over-trimmed. The sail is strapped in, slow and heeling. Ease until the luff curls.'
    tone = 'var(--signal)'
  }
  const poleAdvice =
    Math.abs(poleErr) < 12
      ? 'Pole about square to the apparent wind. 👍'
      : poleErr < 0
        ? 'Pole too far forward — pull the guy back to square it to the wind.'
        : 'Pole too far back — ease the guy so the pole goes forward.'
  const tooClose = twa < 100
  const efficiency = state === 'flying' ? clamp(1 - Math.abs(poleErr) / 60, 0.3, 1) : state === 'stalled' ? 0.45 : 0.1
  return { aw, awa, idealPole, state, verdict, tone, poleAdvice, tooClose, efficiency, bs }
}

function SpinnakerTrim() {
  const [twa, setTwa] = useState(140)
  const [pole, setPole] = useState(30)
  const [ease, setEase] = useState(0.62)
  const m = useSpinnakerModel(twa, pole, ease)
  const mainAngle = idealSailAngle(m.aw.angle)

  return (
    <SimFrame
      title="Spinnaker trim"
      subtitle="Square the pole to the apparent wind with the guy, then play the sheet so the luff just curls."
      visual={
        <svg viewBox="0 0 600 600" className="block h-auto w-full select-none">
          <WaterDefs id="sp" />
          <Water id="sp" width={600} height={600} />
          <WindField windFrom={twa} width={600} height={600} speed={12} />
          <WindArrow windFrom={twa} cx={300} cy={330} r={230} speed={12} />
          <g transform="translate(300 330) scale(2.6)">
            <Boat heading={0} sail={mainAngle} side={-1} showJib={false} />
            <Kite pole={pole} ease={ease} state={m.state} side={1} />
          </g>
          <g fontSize={13} fontWeight={700}>
            <text x={20} y={580} fill="var(--wind)">— guy (controls the pole)</text>
            <text x={580} y={580} textAnchor="end" fill="var(--signal)">sheet (trims the sail) —</text>
          </g>
        </svg>
      }
      footer={
        <>
          <strong className="text-ink">Guy & sheet:</strong> on the windward side the guy sets the pole angle; on the
          leeward side the sheet trims the sail. Keep the two clews roughly level and the pole at right angles to the
          apparent wind.
        </>
      }
    >
      <div className="rounded-2xl border px-4 py-3" style={{ borderColor: m.tone, background: 'var(--surface-2)' }}>
        <div className="font-display text-lg font-bold" style={{ color: m.tone }}>
          {m.state === 'flying' ? 'Flying well' : m.state === 'collapsed' ? 'Collapsed' : 'Over-trimmed'}
        </div>
        <p className="mt-1 text-sm text-ink">{m.verdict}</p>
        <p className="mt-1 text-sm text-muted">{m.poleAdvice}</p>
        {m.tooClose && <p className="mt-1 text-sm font-semibold text-port">Getting tight for a symmetric spinnaker — watch out for a broach.</p>}
      </div>
      <Meter label={`Drive ${Math.round(m.efficiency * 100)}%`} value={m.efficiency} color={m.tone} />
      <div className="space-y-2">
        <Slider label="True wind angle" value={twa} min={90} max={180} unit="°" onChange={setTwa} hint={`Apparent wind ${Math.round(m.awa)}° — ideal pole ≈ ${Math.round(m.idealPole)}° from the forestay`} />
        <Slider label="Pole angle (guy)" value={pole} min={0} max={90} unit="°" onChange={setPole} format={(v) => (v < 10 ? 'on the forestay' : v > 80 ? 'squared right back' : `${v}° back`)} />
        <Slider label="Sheet" value={Math.round(ease * 100)} min={0} max={100} onChange={(v) => setEase(v / 100)} format={(v) => (v < 45 ? 'trimmed hard' : v > 82 ? 'over-eased' : 'eased to the curl')} />
      </div>
    </SimFrame>
  )
}

interface ManoeuvreStep extends Step {
  kite: { pole: number; ease: number; state: KiteState; side: 1 | -1 }
  jib: boolean
  main: { angle: number; side: 1 | -1 }
}

const MANOEUVRES: Record<'hoist' | 'gybe' | 'drop', ManoeuvreStep[]> = {
  hoist: [
    {
      title: 'Prepare before the mark',
      body: 'Pack the kite in its bag on the leeward side. Clip sheet, guy and halyard on — check none are twisted or outside anything.',
      roles: [['Bow', 'Pole on the mast, guy through the pole end.'], ['Pit', 'Halyard ready to haul.'], ['Trimmer', 'Sheet and guy loaded.']],
      call: 'Pole up!',
      kite: { pole: 20, ease: 0.6, state: 'bag', side: 1 },
      jib: true,
      main: { angle: 40, side: -1 },
    },
    {
      title: 'Bear away & hoist',
      body: 'Helm bears away to a broad reach. The jib blankets the kite so it goes up without filling too early.',
      call: 'Hoist!',
      roles: [['Pit', 'Haul the halyard as fast as possible — all the way to the top.'], ['Trimmer', 'Pull the guy back to bring the corner to the pole.']],
      kite: { pole: 20, ease: 0.5, state: 'hoisting', side: 1 },
      jib: true,
      main: { angle: 65, side: -1 },
    },
    {
      title: 'Fill & trim',
      body: 'Once the halyard is made, sheet on to fill the kite. Square the pole to the apparent wind.',
      roles: [['Trimmer', 'Trim the sheet until it fills, then ease to the curl.'], ['Helm', 'Steer smoothly, watch the kite.']],
      kite: { pole: 45, ease: 0.62, state: 'flying', side: 1 },
      jib: true,
      main: { angle: 70, side: -1 },
    },
    {
      title: 'Drop the jib',
      body: 'With the kite drawing, lower or furl the jib so it doesn’t steal wind from the spinnaker.',
      roles: [['Bow', 'Furl or drop the jib.'], ['Trimmer', 'Keep playing the sheet.']],
      kite: { pole: 45, ease: 0.62, state: 'flying', side: 1 },
      jib: false,
      main: { angle: 72, side: -1 },
    },
  ],
  gybe: [
    {
      title: 'Prepare',
      body: 'Bear away to a run. Square the pole back and ease the sheet so the kite floats in front of the boat.',
      call: 'Ready to gybe!',
      roles: [['Bow', 'Go to the mast, ready to trip the pole.'], ['Trimmer', 'Hold both sheet and guy.']],
      kite: { pole: 80, ease: 0.6, state: 'flying', side: 1 },
      jib: false,
      main: { angle: 78, side: -1 },
    },
    {
      title: 'Trip the pole',
      body: 'End-for-end gybe (smaller keelboats): unclip the pole from the mast and clip it onto the old sheet — the new guy.',
      call: 'Gybe-oh!',
      roles: [['Helm', 'Turn slowly through dead downwind.'], ['Main', 'Pull the boom across under control.'], ['Bow', 'Pole off the mast, onto the new guy.']],
      kite: { pole: 90, ease: 0.6, state: 'collapsed', side: 1 },
      jib: false,
      main: { angle: 10, side: 1 },
    },
    {
      title: 'Pole on the new side',
      body: 'Clip the other end of the pole onto the mast. The kite has flown across the bow on its own sheets.',
      roles: [['Bow', 'Pole end onto the mast, check it’s clipped.'], ['Trimmer', 'Keep the kite flying with the new sheet.']],
      kite: { pole: 80, ease: 0.6, state: 'flying', side: -1 },
      jib: false,
      main: { angle: 75, side: 1 },
    },
    {
      title: 'Trim for the new course',
      body: 'Helm heads up to the new course; trimmer sets the pole and plays the sheet. Bigger boats use a dip-pole gybe instead.',
      roles: [['Trimmer', 'Square the pole, ease sheet to the curl.']],
      kite: { pole: 45, ease: 0.62, state: 'flying', side: -1 },
      jib: false,
      main: { angle: 70, side: 1 },
    },
  ],
  drop: [
    {
      title: 'Prepare & hoist the jib',
      body: 'Plan the drop well before the leeward mark. Hoist or unfurl the jib first so you can sail upwind straight away.',
      call: 'Prepare to drop!',
      roles: [['Bow', 'Jib up, check the halyard is free to run.']],
      kite: { pole: 45, ease: 0.62, state: 'flying', side: 1 },
      jib: true,
      main: { angle: 70, side: -1 },
    },
    {
      title: 'Ease the guy & gather',
      body: 'Leeward drop: let the pole go forward to the forestay. A crew grabs the sheet / foot behind the mainsail.',
      roles: [['Trimmer', 'Release the guy so the kite flags behind the main.'], ['Bow', 'Grab the foot under the boom.']],
      call: 'Drop!',
      kite: { pole: 5, ease: 0.9, state: 'gather', side: 1 },
      jib: true,
      main: { angle: 68, side: -1 },
    },
    {
      title: 'Lower the halyard',
      body: 'Pit releases the halyard at the speed the crew can pull the sail in — never let it drop into the water.',
      roles: [['Pit', 'Controlled halyard release.'], ['Crew', 'Pull the sail down into the cockpit / hatch.']],
      kite: { pole: 0, ease: 1, state: 'bag', side: 1 },
      jib: true,
      main: { angle: 60, side: -1 },
    },
    {
      title: 'Round the mark',
      body: 'Pole down, sheets in, and trim for upwind. Tidy the lines before you need them again.',
      roles: [['Everyone', 'Hike out and trim for close-hauled.']],
      kite: { pole: 0, ease: 1, state: 'bag', side: 1 },
      jib: true,
      main: { angle: 12, side: -1 },
    },
  ],
}

function ManoeuvreDiagram({ step }: { step: ManoeuvreStep }) {
  // Wind over the pole (windward) side; dead astern while gybing.
  const windFrom = step.kite.state === 'collapsed' ? 180 : step.kite.side === 1 ? 150 : 210
  return (
    <svg viewBox="0 0 420 380" className="block h-auto w-full">
      <WaterDefs id="spm" />
      <Water id="spm" width={420} height={380} />
      <WindField windFrom={windFrom} width={420} height={380} speed={12} density={0.6} />
      <g transform="translate(210 210) scale(2)">
        <Boat heading={0} sail={step.main.angle} side={step.main.side} jib={step.main.angle * 0.8} showJib={step.jib} />
        <Kite {...step.kite} />
      </g>
    </svg>
  )
}

export function Spinnaker({ mode: initial = 'trim' }: { mode?: 'trim' | 'hoist' | 'gybe' | 'drop' }) {
  const [mode, setMode] = useState(initial)
  return (
    <div>
      <div className="mb-[-1rem] flex justify-center">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'trim', label: 'Trim' },
            { value: 'hoist', label: 'Hoist' },
            { value: 'gybe', label: 'Gybe' },
            { value: 'drop', label: 'Drop' },
          ]}
        />
      </div>
      {mode === 'trim' ? (
        <SpinnakerTrim />
      ) : (
        <Stepper
          key={mode}
          title={`Spinnaker ${mode}`}
          steps={MANOEUVRES[mode]}
          visual={(i) => <ManoeuvreDiagram step={MANOEUVRES[mode][i]} />}
          autoMs={4200}
        />
      )}
    </div>
  )
}
