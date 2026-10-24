import { useCallback, useEffect, useState } from 'react'

/** Matilda Bay, on the Swan River. */
export const LOCATION = { name: 'Matilda Bay', lat: -31.979, lon: 115.834 }

export interface WeatherData {
  current: { time: string; wind: number; gust: number; dir: number; temp: number }
  hourly: { time: string[]; wind: number[]; gust: number[]; dir: number[] }
  fetchedAt: number
}

const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}` +
  '&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m' +
  '&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m' +
  '&wind_speed_unit=kn&timezone=Australia%2FPerth&forecast_days=2'

const CACHE_KEY = 't-sailor-weather'
const MAX_AGE = 10 * 60 * 1000

function readCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as WeatherData) : null
  } catch {
    return null
  }
}

export async function fetchWeather(): Promise<WeatherData> {
  const res = await fetch(URL)
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`)
  const j = await res.json()
  const data: WeatherData = {
    current: {
      time: j.current.time,
      wind: j.current.wind_speed_10m,
      gust: j.current.wind_gusts_10m,
      dir: j.current.wind_direction_10m,
      temp: j.current.temperature_2m,
    },
    hourly: {
      time: j.hourly.time,
      wind: j.hourly.wind_speed_10m,
      gust: j.hourly.wind_gusts_10m,
      dir: j.hourly.wind_direction_10m,
    },
    fetchedAt: Date.now(),
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable — fine */
  }
  return data
}

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(() => readCache())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchWeather())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the weather')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = readCache()
    if (!cached || Date.now() - cached.fetchedAt > MAX_AGE) refresh()
  }, [refresh])

  return { data, error, loading, refresh }
}

/** The Doctor blows from the south-west, often swinging towards the west on the river. */
export const isSouthWesterly = (dir: number) => dir >= 190 && dir <= 290

/** Hours (indexes into hourly) for today, local Perth time. */
export function todayIndexes(data: WeatherData) {
  const day = data.current.time.slice(0, 10)
  return data.hourly.time.map((t, i) => (t.startsWith(day) ? i : -1)).filter((i) => i >= 0)
}

/** First hour today, from late morning, when a SW–W breeze of 6+ kn sets in after a non-SW wind. */
export function seaBreezeOnset(data: WeatherData): number | null {
  const idx = todayIndexes(data)
  for (const i of idx) {
    const hour = Number(data.hourly.time[i].slice(11, 13))
    if (hour < 10 || hour > 17) continue
    const sw = isSouthWesterly(data.hourly.dir[i]) && data.hourly.wind[i] >= 6
    const before = i > 0 && !isSouthWesterly(data.hourly.dir[i - 1])
    if (sw && before) return i
  }
  return null
}

export function advice(knots: number, gust: number) {
  if (knots < 4) return { title: 'Light air', text: 'Very light — patience and gentle trim. Maybe a motor-sail day.', tone: 'var(--wind)' }
  if (knots < 11) return { title: 'Great learning breeze', text: 'Ideal for courses: steady, responsive, not too much heel.', tone: 'var(--starboard)' }
  if (knots < 17) return { title: 'Lively', text: 'Fun sailing with crew on the rail. Learners: be ready to reef in the gusts.', tone: 'var(--starboard)' }
  if (knots < 22 && gust < 28) return { title: 'Fresh — reef', text: 'Reef the main and flatten sails. Instructors may limit training.', tone: 'var(--signal)' }
  return { title: 'Strong — likely no training', text: 'Heavy weather for keelboat training. Check with the club before heading down.', tone: 'var(--port)' }
}
