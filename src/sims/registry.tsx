import type { ComponentType, ReactNode } from 'react'
import { Boat } from '../components/svg/Boat'
import { PointsOfSail, POS_COLORS } from './PointsOfSail'
import { SailTrim } from './SailTrim'
import { TackGybe } from './TackGybe'
import { ApparentWind } from './ApparentWind'
import { Spinnaker } from './Spinnaker'
import { RightOfWay } from './RightOfWay'
import { StartLine } from './StartLine'
import { ManOverboard } from './ManOverboard'

export interface SimInfo {
  id: string
  title: string
  blurb: string
  courses: string[]
  Component: ComponentType
  thumb: ReactNode
}

const Thumb = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 200 120" className="h-full w-full">
    <rect width="200" height="120" fill="var(--water)" />
    <path d="M0 30 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="white" strokeOpacity="0.25" />
    <path d="M0 90 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="white" strokeOpacity="0.25" />
    {children}
  </svg>
)

export const SIMS: SimInfo[] = [
  {
    id: 'points-of-sail',
    title: 'Points of Sail',
    blurb: 'Steer a full circle and watch the sails, speed and heel change. Find the no-go zone.',
    courses: ['start-crewing', 'start-helming'],
    Component: PointsOfSail,
    thumb: (
      <Thumb>
        <path d="M100 60 L70 0 L130 0 Z" fill={POS_COLORS['no-go']} opacity={0.35} />
        <Boat x={60} y={70} heading={300} scale={0.5} sail={20} side={-1} />
        <Boat x={140} y={70} heading={100} scale={0.5} sail={55} side={1} />
      </Thumb>
    ),
  },
  {
    id: 'sail-trim',
    title: 'Sail Trim & Telltales',
    blurb: 'Ease and trim until the telltales stream. See the airflow stall and luff.',
    courses: ['start-crewing', 'start-helming'],
    Component: SailTrim,
    thumb: (
      <Thumb>
        <path d="M80 20 L80 100 L150 100 Z" fill="var(--sail)" stroke="var(--sail-edge)" />
        <path d="M80 50 q10 -3 20 0 t20 0" stroke="var(--port)" strokeWidth={4} fill="none" />
        <path d="M80 75 q10 -3 20 0 t20 0" stroke="var(--starboard)" strokeWidth={4} fill="none" />
      </Thumb>
    ),
  },
  {
    id: 'tack-gybe',
    title: 'Tack & Gybe',
    blurb: 'Step through each manoeuvre with the calls, helm and crew actions.',
    courses: ['start-crewing', 'start-helming', 'start-skippering'],
    Component: TackGybe,
    thumb: (
      <Thumb>
        <path d="M40 110 Q100 10 160 110" fill="none" stroke="white" strokeWidth={3} strokeDasharray="4 5" />
        <Boat x={100} y={50} heading={0} scale={0.5} sail={2} flow="luffing" />
      </Thumb>
    ),
  },
  {
    id: 'apparent-wind',
    title: 'Apparent Wind',
    blurb: 'Why the wind you feel moves forward as you speed up — shown as vectors.',
    courses: ['start-helming', 'spinnakers'],
    Component: ApparentWind,
    thumb: (
      <Thumb>
        <line x1={160} y1={30} x2={100} y2={60} stroke="var(--wind)" strokeWidth={5} />
        <line x1={130} y1={10} x2={100} y2={60} stroke="var(--signal)" strokeWidth={5} />
        <Boat x={100} y={75} heading={0} scale={0.5} sail={30} side={-1} />
      </Thumb>
    ),
  },
  {
    id: 'spinnaker',
    title: 'Spinnaker',
    blurb: 'Set the pole and sheet, then walk through the hoist, gybe and drop.',
    courses: ['spinnakers'],
    Component: Spinnaker,
    thumb: (
      <Thumb>
        <Boat x={100} y={78} heading={180} scale={0.5} sail={70} side={1} />
        <path d="M70 40 Q100 -5 130 40 Q100 30 70 40 Z" fill="var(--signal)" />
      </Thumb>
    ),
  },
  {
    id: 'right-of-way',
    title: 'Right of Way',
    blurb: 'Place two boats and find out who must keep clear — and which rule says so.',
    courses: ['start-skippering', 'start-racing'],
    Component: RightOfWay,
    thumb: (
      <Thumb>
        <Boat x={70} y={60} heading={45} scale={0.5} sail={18} side={1} accent="var(--port)" />
        <Boat x={135} y={60} heading={315} scale={0.5} sail={18} side={-1} accent="var(--starboard)" />
      </Thumb>
    ),
  },
  {
    id: 'start-line',
    title: 'Start Line & Laylines',
    blurb: 'Find the favoured end, see the laylines and run a 5-4-1-0 start sequence.',
    courses: ['start-racing'],
    Component: StartLine,
    thumb: (
      <Thumb>
        <line x1={30} y1={95} x2={170} y2={85} stroke="var(--ink)" strokeDasharray="5 4" strokeWidth={2} />
        <circle cx={30} cy={95} r={6} fill="var(--signal)" />
        <rect x={160} y={78} width={22} height={12} rx={3} fill="var(--ink)" />
        <circle cx={100} cy={18} r={6} fill="var(--signal)" />
      </Thumb>
    ),
  },
  {
    id: 'man-overboard',
    title: 'Man Overboard',
    blurb: 'The reach–tack–reach recovery, animated step by step.',
    courses: ['start-skippering'],
    Component: ManOverboard,
    thumb: (
      <Thumb>
        <circle cx={100} cy={60} r={6} fill="var(--signal)" />
        <circle cx={100} cy={60} r={14} fill="none" stroke="var(--signal)" opacity={0.5} />
        <path d="M100 60 L170 60 Q185 40 160 30 L110 50" fill="none" stroke="white" strokeWidth={3} strokeDasharray="4 5" />
      </Thumb>
    ),
  },
]

export const simById = (id: string) => SIMS.find((s) => s.id === id)
