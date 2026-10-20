import { NO_GO, bearingVec, dot, sub, tackOf, windAngle, type Tack, type Vec } from './sailing'

export type RulesMode = 'rrs' | 'colregs'
export type BoatId = 'A' | 'B'

export interface BoatPose extends Vec {
  heading: number
}

export interface RightOfWay {
  keepClear: BoatId | 'both' | null
  rule: string
  title: string
  explanation: string
  tacks: Record<BoatId, Tack>
  tacking: Record<BoatId, boolean>
  overlapped: boolean
  windward: BoatId | null
  clearAstern: BoatId | null
}

const other = (b: BoatId): BoatId => (b === 'A' ? 'B' : 'A')

/**
 * Who must keep clear between two sailing boats.
 * `length` is the hull length in the same units as the positions; it decides "overlapped".
 */
export function rightOfWay(a: BoatPose, b: BoatPose, windFrom: number, length: number, mode: RulesMode): RightOfWay {
  const wa = windAngle(a.heading, windFrom)
  const wb = windAngle(b.heading, windFrom)
  const tacks = { A: tackOf(wa), B: tackOf(wb) }
  const tacking = { A: Math.abs(wa) < NO_GO - 5, B: Math.abs(wb) < NO_GO - 5 }

  // Clear astern: a boat's bow is behind a line abeam from the other boat's stern.
  const bBehindA = dot(sub(b, a), bearingVec(a.heading)) < -length
  const aBehindB = dot(sub(a, b), bearingVec(b.heading)) < -length
  const clearAstern: BoatId | null = bBehindA ? 'B' : aBehindB ? 'A' : null
  const overlapped = clearAstern === null

  const w = bearingVec(windFrom)
  const windward: BoatId = dot(a, w) > dot(b, w) ? 'A' : 'B'

  const base = { tacks, tacking, overlapped, windward: null as BoatId | null, clearAstern }
  const rrs = mode === 'rrs'

  if (tacking.A && tacking.B) {
    return {
      ...base,
      keepClear: 'both',
      rule: rrs ? 'Rule 13' : 'COLREG 2 & 8',
      title: 'Both boats are tacking',
      explanation: rrs
        ? 'When two boats are tacking at the same time, the one on the other’s port side or the one astern must keep clear. In practice: both take early action to avoid contact.'
        : 'Neither boat is properly under sail. Both must act early and decisively to avoid a collision.',
    }
  }
  if (tacking.A || tacking.B) {
    const t: BoatId = tacking.A ? 'A' : 'B'
    return {
      ...base,
      keepClear: t,
      rule: rrs ? 'Rule 13' : 'COLREG 8',
      title: `Boat ${t} is tacking`,
      explanation: rrs
        ? `After passing head to wind, a boat must keep clear of other boats until she is on a close-hauled course. Boat ${t} is inside the no-go zone, so it keeps clear.`
        : `Boat ${t} is head-to-wind and not yet sailing on a tack. It must stay out of the way until it has settled on its new course.`,
    }
  }

  if (tacks.A !== tacks.B) {
    const port: BoatId = tacks.A === 'port' ? 'A' : 'B'
    return {
      ...base,
      keepClear: port,
      rule: rrs ? 'Rule 10' : 'COLREG 12(a)(i)',
      title: 'Opposite tacks — port gives way',
      explanation: `Boat ${port} has the wind on its port side (port tack) and must keep clear of Boat ${other(port)} on starboard tack. Remember: "Starboard!" is the call you hear.`,
    }
  }

  if (clearAstern) {
    return {
      ...base,
      keepClear: clearAstern,
      rule: rrs ? 'Rule 12' : 'COLREG 13',
      title: rrs ? 'Same tack, not overlapped — clear astern gives way' : 'Overtaking boat gives way',
      explanation: rrs
        ? `Boat ${clearAstern} is clear astern of Boat ${other(clearAstern)} and must keep clear. The boat ahead has right of way.`
        : `Boat ${clearAstern} is coming up from behind, so it is the overtaking vessel and must keep out of the way — even under sail.`,
    }
  }

  return {
    ...base,
    windward,
    keepClear: windward,
    rule: rrs ? 'Rule 11' : 'COLREG 12(a)(ii)',
    title: 'Same tack, overlapped — windward gives way',
    explanation: `Both boats are on ${tacks.A} tack and overlapped. Boat ${windward} is to windward (closer to the wind) and must keep clear of the leeward Boat ${other(windward)}.`,
  }
}
