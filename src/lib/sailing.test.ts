import { describe, expect, it } from 'vitest'
import {
  apparentWind,
  beaufortForce,
  bearingVec,
  boatSpeed,
  compassPoint,
  idealSailAngle,
  isInNoGoZone,
  lineBias,
  norm180,
  norm360,
  pointOfSail,
  sailFlow,
  tackOf,
  vecBearing,
  windAngle,
} from './sailing'
import { rightOfWay } from './rules'

describe('angles', () => {
  it('normalises', () => {
    expect(norm360(-90)).toBe(270)
    expect(norm360(725)).toBe(5)
    expect(norm180(270)).toBe(-90)
    expect(norm180(180)).toBe(180)
  })

  it('wind angle sign gives the tack', () => {
    // Wind from north, heading west: wind over the starboard (right) side.
    expect(windAngle(270, 0)).toBe(90)
    expect(tackOf(windAngle(270, 0))).toBe('starboard')
    // Heading east with a northerly: port tack.
    expect(tackOf(windAngle(90, 0))).toBe('port')
    expect(tackOf(windAngle(0, 0))).toBe('head-to-wind')
  })

  it('bearing vectors point the right way in SVG space', () => {
    expect(bearingVec(0).y).toBeCloseTo(-1)
    expect(bearingVec(90).x).toBeCloseTo(1)
    expect(vecBearing({ x: 0, y: 1 })).toBeCloseTo(180)
  })
})

describe('points of sail', () => {
  it.each([
    [20, 'no-go'],
    [-44, 'no-go'],
    [45, 'close-hauled'],
    [70, 'close-reach'],
    [-90, 'beam-reach'],
    [135, 'broad-reach'],
    [175, 'run'],
    [180, 'run'],
  ])('%s° is %s', (twa, id) => {
    expect(pointOfSail(twa).id).toBe(id)
  })

  it('no-go zone is ±45°', () => {
    expect(isInNoGoZone(30)).toBe(true)
    expect(isInNoGoZone(-30)).toBe(true)
    expect(isInNoGoZone(50)).toBe(false)
  })
})

describe('performance', () => {
  it('boat stops head to wind and is fastest reaching', () => {
    expect(boatSpeed(12, 10)).toBe(0)
    expect(boatSpeed(12, 100)).toBeGreaterThan(boatSpeed(12, 50))
    expect(boatSpeed(12, 100)).toBeGreaterThan(boatSpeed(12, 180))
  })

  it('apparent wind on a beam reach moves forward and strengthens', () => {
    const aw = apparentWind(10, 90, 10)
    expect(aw.angle).toBeCloseTo(45)
    expect(aw.speed).toBeCloseTo(14.142, 2)
  })

  it('apparent wind on a run is lighter', () => {
    const aw = apparentWind(10, 180, 5)
    expect(aw.speed).toBeCloseTo(5)
  })

  it('sail trim', () => {
    expect(idealSailAngle(30)).toBe(12)
    expect(sailFlow(60, 58)).toBe('luffing')
    expect(sailFlow(60, 40)).toBe('streaming')
    expect(sailFlow(60, 10)).toBe('stalled')
  })
})

describe('start line bias', () => {
  it('square line has no bias', () => {
    const r = lineBias({ x: 100, y: 0 }, { x: -100, y: 0 }, 0)
    expect(r.favoured).toBe('square')
  })
  it('pin end further upwind is favoured', () => {
    const r = lineBias({ x: 100, y: 0 }, { x: -100, y: -20 }, 0)
    expect(r.favoured).toBe('pin')
    expect(r.gain).toBeCloseTo(20)
  })
})

describe('rules', () => {
  const L = 100
  it('port gives way to starboard', () => {
    const r = rightOfWay({ x: 0, y: 0, heading: 45 }, { x: 300, y: 0, heading: 315 }, 0, L, 'rrs')
    expect(r.tacks.A).toBe('port')
    expect(r.keepClear).toBe('A')
    expect(r.rule).toBe('Rule 10')
  })
  it('windward boat keeps clear when overlapped', () => {
    // Both on starboard tack heading west, A is further north (upwind).
    const r = rightOfWay({ x: 0, y: -80, heading: 270 }, { x: 0, y: 80, heading: 270 }, 0, L, 'rrs')
    expect(r.overlapped).toBe(true)
    expect(r.keepClear).toBe('A')
    expect(r.rule).toBe('Rule 11')
  })
  it('boat clear astern keeps clear', () => {
    const r = rightOfWay({ x: 0, y: 0, heading: 270 }, { x: 250, y: 0, heading: 270 }, 0, L, 'rrs')
    expect(r.clearAstern).toBe('B')
    expect(r.keepClear).toBe('B')
  })
  it('tacking boat keeps clear', () => {
    const r = rightOfWay({ x: 0, y: 0, heading: 5 }, { x: 300, y: 0, heading: 315 }, 0, L, 'rrs')
    expect(r.keepClear).toBe('A')
    expect(r.rule).toBe('Rule 13')
  })
})

describe('misc', () => {
  it('beaufort', () => {
    expect(beaufortForce(0)).toBe(0)
    expect(beaufortForce(12)).toBe(4)
    expect(beaufortForce(25)).toBe(6)
    expect(beaufortForce(70)).toBe(12)
  })
  it('compass point', () => {
    expect(compassPoint(225)).toBe('SW')
    expect(compassPoint(359)).toBe('N')
  })
})
