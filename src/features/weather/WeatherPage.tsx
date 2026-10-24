import { Link } from 'react-router'
import { Compass, RefreshCw, Sailboat, TableProperties } from 'lucide-react'
import { useState } from 'react'
import { LOCATION, advice, seaBreezeOnset, todayIndexes, useWeather } from '../../lib/weather'
import { beaufortForce, compassPoint } from '../../lib/sailing'
import { BEAUFORT, BeaufortScale } from '../../tools/Beaufort'
import { Button, Stat } from '../../components/ui/controls'
import { PageHeader } from '../../components/ui/blocks'
import { WindCompass } from './WindCompass'
import { WindChart } from './WindChart'

const ago = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`
}

export function WeatherPage() {
  const { data, error, loading, refresh } = useWeather()
  const [table, setTable] = useState(false)

  return (
    <>
      <PageHeader eyebrow="Weather" title={`Wind at ${LOCATION.name}`}>
        Live forecast for Matilda Bay, and what it means for a keelboat session.
      </PageHeader>

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-port/40 bg-port/10 p-4 text-sm">
          <span>
            Couldn’t load the weather ({error}). {data ? 'Showing the last reading.' : ''}
          </span>
          <Button variant="soft" onClick={refresh}>
            <RefreshCw size={15} /> Try again
          </Button>
        </div>
      )}

      {!data ? (
        <div className="h-72 animate-pulse rounded-3xl bg-surface-2" />
      ) : (
        <WeatherBody data={data} loading={loading} refresh={refresh} table={table} setTable={setTable} />
      )}
    </>
  )
}

function WeatherBody({
  data,
  loading,
  refresh,
  table,
  setTable,
}: {
  data: NonNullable<ReturnType<typeof useWeather>['data']>
  loading: boolean
  refresh: () => void
  table: boolean
  setTable: (v: boolean) => void
}) {
  const c = data.current
  const force = beaufortForce(c.wind)
  const a = advice(c.wind, c.gust)
  const idx = todayIndexes(data)
  const onset = seaBreezeOnset(data)
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <WindCompass dir={c.dir} knots={c.wind} />
          <div className="mt-3 text-center">
            <div className="font-display text-xl font-bold">
              {compassPoint(c.dir)} {Math.round(c.wind)} kn
            </div>
            <div className="text-sm text-muted">gusting {Math.round(c.gust)} kn · {Math.round(c.temp)}°C</div>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)', borderLeft: `5px solid ${a.tone}` }}>
            <div className="text-xs font-semibold tracking-wider text-muted uppercase">What this means</div>
            <div className="font-display text-2xl font-bold" style={{ color: a.tone }}>
              {a.title}
            </div>
            <p className="mt-1 text-[15px]">{a.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Beaufort" value={`F${force}`} sub={BEAUFORT[force].name} />
            <Stat label="Direction" value={`${Math.round(c.dir)}°`} sub={`from the ${compassPoint(c.dir)}`} />
            <Stat label="Gust factor" value={`+${Math.max(0, Math.round(c.gust - c.wind))} kn`} sub="gust above mean" />
            <Stat
              label="Sea breeze"
              value={onset != null ? data.hourly.time[onset].slice(11, 16) : '—'}
              sub={onset != null ? 'SW sets in (forecast)' : 'none detected today'}
            />
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Link
              to={`/lab/points-of-sail?wind=${Math.round(c.dir)}&tws=${Math.round(c.wind)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-sea px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              <Sailboat size={16} /> Sail in today’s wind
            </Link>
            <Button variant="ghost" onClick={refresh} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Updated {ago(data.fetchedAt)}
            </Button>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Today, hour by hour</h2>
          <Button variant="ghost" onClick={() => setTable(!table)}>
            {table ? <Compass size={15} /> : <TableProperties size={15} />} {table ? 'Chart' : 'Table'}
          </Button>
        </div>
        {table ? (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted uppercase">
                <tr>
                  <th className="py-1.5">Time</th>
                  <th>Wind</th>
                  <th>Gust</th>
                  <th>From</th>
                </tr>
              </thead>
              <tbody>
                {idx.map((i) => (
                  <tr key={i} className={`border-t border-line ${i === onset ? 'bg-signal-soft' : ''}`}>
                    <td className="py-1.5">{data.hourly.time[i].slice(11, 16)}</td>
                    <td>{Math.round(data.hourly.wind[i])} kn</td>
                    <td>{Math.round(data.hourly.gust[i])} kn</td>
                    <td>
                      {compassPoint(data.hourly.dir[i])} ({Math.round(data.hourly.dir[i])}°)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <WindChart data={data} indexes={idx} highlight={onset} />
        )}
        <p className="mt-3 text-xs text-muted">
          Forecast from Open-Meteo for {LOCATION.lat.toFixed(3)}, {LOCATION.lon.toFixed(3)}. Model forecasts can miss local effects — always check the
          Bureau of Meteorology and ask your instructor.
        </p>
      </section>

      <BeaufortScale knots={c.wind} />
    </div>
  )
}
