import type { MDXComponents } from 'mdx/types'
import { Link } from 'react-router'
import { Callout, KeyTerms } from '../components/ui/blocks'
import { Stepper } from '../components/ui/Stepper'
import { PointsOfSail } from '../sims/PointsOfSail'
import { SailTrim } from '../sims/SailTrim'
import { TackGybe } from '../sims/TackGybe'
import { ApparentWind } from '../sims/ApparentWind'
import { Spinnaker } from '../sims/Spinnaker'
import { RightOfWay } from '../sims/RightOfWay'
import { StartLine } from '../sims/StartLine'
import { ManOverboard } from '../sims/ManOverboard'
import { Anatomy } from '../tools/Anatomy'
import { KnotViewer } from '../tools/knots/KnotViewer'
import { BeaufortScale } from '../tools/Beaufort'
import { Checklist } from '../tools/Checklists'
import { FlagSignals } from './diagrams/FlagSignals'
import { ByTheLee, RudderDemo, SafetyZones, UpwindGroove, WinchSteps } from './diagrams/crewing'
import { AnchorScope, ChannelMarks, CrewPositions, DockLines, HeaveTo, MooringApproach, ReefSteps, SeaBreeze } from './diagrams/skippering'
import { CourseDiagram, MarkRounding, PenaltyTurns, SpinnakerParts, WindShift } from './diagrams/racing'

/** Everything a lesson .mdx file can use without importing it. */
export const mdxComponents: MDXComponents = {
  a: ({ href = '', children }) =>
    href.startsWith('/') ? <Link to={href}>{children}</Link> : <a href={href} target="_blank" rel="noreferrer">{children}</a>,
  Callout,
  KeyTerms,
  Stepper,
  PointsOfSail,
  SailTrim,
  TackGybe,
  ApparentWind,
  Spinnaker,
  RightOfWay,
  StartLine,
  ManOverboard,
  Anatomy,
  KnotViewer,
  BeaufortScale,
  Checklist,
  FlagSignals,
  SafetyZones,
  WinchSteps,
  RudderDemo,
  UpwindGroove,
  ByTheLee,
  HeaveTo,
  DockLines,
  MooringApproach,
  CrewPositions,
  SeaBreeze,
  ChannelMarks,
  ReefSteps,
  AnchorScope,
  SpinnakerParts,
  CourseDiagram,
  MarkRounding,
  PenaltyTurns,
  WindShift,
}
