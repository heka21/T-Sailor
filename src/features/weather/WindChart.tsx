import { useState } from 'react'
import type { WeatherData } from '../../lib/weather'
import { compassPoint } from '../../lib/sailing'

/** Today's hourly wind and gusts (one axis, knots) with direction arrows under each hour. */
export function WindChart({ data, indexes, highlight }: { data: WeatherData; indexes: number[]; highlight: number | null }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720
  const H = 280
  const pad = { l: 36, r: 12, t: 16, b: 64 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const wind = indexes.map((i) => data.hourly.wind[i])
  const gust = indexes.map((i) => data.hourly.gust[i])
  const max = Math.max(15, Math.ceil(Math.max(...gust) / 5) * 5)
  const x = (k: number) => pad.l + (k / Math.max(1, indexes.length - 1)) * iw
  const y = (v: number) => pad.t + ih - (v / max) * ih
  const line = (vals: number[]) => vals.map((v, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line(wind)} L${x(wind.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const nowK = indexes.findIndex((i) => data.hourly.time[i].slice(0, 13) === data.current.time.slice(0, 13))
  const hk = hover ?? null
  const hi = hk != null ? indexes[hk] : null

  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-4 text-xs font-medium text-muted">
        <span className="flex items-center gap-1.5">
          <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--wind)" strokeWidth="2" /></svg> Wind
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--wind)" strokeWidth="2" strokeDasharray="4 3" opacity="0.7" /></svg> Gusts
        </span>
        {highlight != null && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-signal/30" /> Sea breeze sets in
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-none" onPointerLeave={() => setHover(null)}>
        {/* grid */}
        {Array.from({ length: max / 5 + 1 }, (_, n) => n * 5).map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
              {v}
            </text>
          </g>
        ))}
        <text x={pad.l - 6} y={pad.t - 4} textAnchor="end" fontSize={10} fill="var(--muted)">kn</text>
        {highlight != null && indexes.includes(highlight) && (
          <rect x={x(indexes.indexOf(highlight)) - iw / indexes.length / 2} y={pad.t} width={iw / indexes.length} height={ih} fill="var(--signal)" opacity={0.18} rx={4} />
        )}
        <path d={area} fill="var(--wind)" opacity={0.12} />
        <path d={line(gust)} fill="none" stroke="var(--wind)" strokeWidth={2} strokeDasharray="5 4" opacity={0.7} />
        <path d={line(wind)} fill="none" stroke="var(--wind)" strokeWidth={2.5} strokeLinejoin="round" />
        {nowK >= 0 && (
          <g>
            <line x1={x(nowK)} x2={x(nowK)} y1={pad.t} y2={pad.t + ih} stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 3" />
            <text x={x(nowK)} y={pad.t + 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink)">
              now
            </text>
          </g>
        )}
        {/* direction arrows + hour labels */}
        {indexes.map((i, k) => (
          <g key={i}>
            {k % 2 === 0 && (
              <g transform={`translate(${x(k)} ${H - 40}) rotate(${data.hourly.dir[i]})`}>
                <path d="M0,-9 L0,7 M-4,3 L0,8 L4,3" fill="none" stroke="var(--muted)" strokeWidth={1.8} strokeLinecap="round" />
              </g>
            )}
            {k % 3 === 0 && (
              <text x={x(k)} y={H - 12} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {data.hourly.time[i].slice(11, 13)}h
              </text>
            )}
          </g>
        ))}
        {/* hover hit targets */}
        {indexes.map((i, k) => (
          <rect key={i} x={x(k) - iw / indexes.length / 2} y={pad.t} width={iw / indexes.length} height={ih + 40} fill="transparent" onPointerEnter={() => setHover(k)} onPointerDown={() => setHover(k)} />
        ))}
        {hk != null && (
          <g pointerEvents="none">
            <line x1={x(hk)} x2={x(hk)} y1={pad.t} y2={pad.t + ih} stroke="var(--muted)" strokeWidth={1} />
            <circle cx={x(hk)} cy={y(wind[hk])} r={5} fill="var(--wind)" stroke="var(--surface)" strokeWidth={2} />
            <circle cx={x(hk)} cy={y(gust[hk])} r={4} fill="var(--surface)" stroke="var(--wind)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hk != null && hi != null && (
        <div
          className="pointer-events-none absolute top-8 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg"
          style={{ left: `clamp(0px, calc(${(x(hk) / W) * 100}% - 70px), calc(100% - 150px))` }}
        >
          <div className="font-semibold text-ink">{data.hourly.time[hi].slice(11, 16)}</div>
          <div className="text-muted">
            Wind <span className="font-semibold text-ink">{Math.round(data.hourly.wind[hi])} kn</span> · gust{' '}
            <span className="font-semibold text-ink">{Math.round(data.hourly.gust[hi])}</span>
          </div>
          <div className="text-muted">
            from {compassPoint(data.hourly.dir[hi])} ({Math.round(data.hourly.dir[hi])}°)
          </div>
        </div>
      )}
    </div>
  )
}
