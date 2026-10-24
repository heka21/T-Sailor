import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { BookOpen, ClipboardCheck, FlaskConical, Hash, LayoutGrid, Library, Search as SearchIcon, Spline, Wrench, X } from 'lucide-react'
import { loadIndex, queryWords, search, type Hit, type Kind } from '../../lib/search'
import { useSession } from '../../lib/session'

const KINDS: Record<Kind, { label: string; icon: typeof Hash }> = {
  page: { label: 'Page', icon: LayoutGrid },
  course: { label: 'Course', icon: Library },
  lesson: { label: 'Lesson', icon: BookOpen },
  section: { label: 'Section', icon: Hash },
  sim: { label: 'Simulator', icon: FlaskConical },
  tool: { label: 'Tool', icon: Wrench },
  knot: { label: 'Knot', icon: Spline },
  checklist: { label: 'Checklist', icon: ClipboardCheck },
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 ? (
          <mark key={i} className="rounded bg-sea-soft px-0.5 text-sea">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

function useSearch(q: string, active: boolean) {
  const admin = useSession((s) => !!s.user?.admin)
  const [hits, setHits] = useState<Hit[] | null>(null)
  useEffect(() => {
    if (!active) return
    let stale = false
    loadIndex(admin).then((index) => !stale && setHits(search(index, q)))
    return () => {
      stale = true
    }
  }, [q, active, admin])
  return hits
}

/**
 * Search box with a results list. `overlay` renders results inline (phone sheet) instead of as a dropdown,
 * and `shortcut` makes ⌘K / Ctrl+K and "/" focus it.
 */
export function SearchBox({ overlay = false, shortcut = false, onDone }: { overlay?: boolean; shortcut?: boolean; onDone?: () => void }) {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(overlay)
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const hits = useSearch(q, focused)
  const words = queryWords(q)
  const open = focused && words.length > 0

  useEffect(() => setSel(0), [q])

  useEffect(() => {
    if (overlay) input.current?.focus()
    if (!shortcut) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
        e.preventDefault()
        input.current?.focus()
        input.current?.select()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [overlay, shortcut])

  const go = (hit: Hit) => {
    navigate(hit.to)
    setQ('')
    input.current?.blur()
    onDone?.()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (q) setQ('')
      else {
        input.current?.blur()
        onDone?.()
      }
    } else if (hits?.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setSel((s) => (s + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length)
    } else if (e.key === 'Enter' && hits?.[sel]) {
      go(hits[sel])
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <SearchIcon size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => !overlay && setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder="Search lessons, knots, rules, tools…"
          aria-label="Search"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          aria-activedescendant={open && hits?.[sel] ? `search-hit-${sel}` : undefined}
          className="w-full rounded-xl border border-line bg-surface-2 py-2 pr-14 pl-10 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-sea focus:bg-surface [&::-webkit-search-cancel-button]:hidden"
        />
        {shortcut && !q && (
          <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] text-muted">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        )}
        {q && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div
          id="search-results"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()} // keep focus in the input while clicking a result
          className={
            overlay
              ? 'mt-3'
              : 'absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-xl'
          }
        >
          {hits === null ? (
            <p className="px-3 py-4 text-sm text-muted">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No results for “{q.trim()}”.</p>
          ) : (
            hits.map((hit, i) => {
              const { icon: Icon, label } = KINDS[hit.kind]
              return (
                <button
                  key={hit.to + i}
                  id={`search-hit-${i}`}
                  role="option"
                  aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(hit)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === sel ? 'bg-surface-2' : ''}`}
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sea-soft text-sea">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate font-semibold">
                        <Highlight text={hit.title} words={words} />
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold tracking-wider text-muted uppercase">{label}</span>
                    </span>
                    {hit.subtitle && <span className="block truncate text-xs text-muted">{hit.subtitle}</span>}
                    {hit.snippet && (
                      <span className="mt-0.5 line-clamp-2 block text-sm text-muted">
                        <Highlight text={hit.snippet} words={words} />
                      </span>
                    )}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/** Phone: a search icon that opens a full-screen search sheet. */
export function SearchButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink ${className}`}
      >
        <SearchIcon size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg px-4 pt-3 pb-10" role="dialog" aria-label="Search">
          <div className="flex items-center gap-2">
            <SearchBox overlay onDone={() => setOpen(false)} />
            <button onClick={() => setOpen(false)} className="shrink-0 px-2 py-2 text-sm font-semibold text-sea">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
