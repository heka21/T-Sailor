# T-Sailor

Visual study companion for the Royal Perth Yacht Club keelboat courses: Start Crewing, Start Helming,
Start Skippering, Spinnakers and Start Racing.

## Run it

```sh
pnpm docker:up         # docker compose up -d --build → http://<mac-mini>:8090
pnpm dev               # hot-reload dev server on the LAN
pnpm test              # sailing maths unit tests
pnpm smoke             # visit every route in the running container, fail on console errors
```

## Where things live

- `src/content/<course>/<NN>-<slug>.mdx` — lessons. The number sets the order; `export const meta` sets the title,
  summary and minutes. Lessons can use any component listed in `src/content/mdxComponents.tsx` without importing it.
- `src/sims/` — interactive simulators (also shown in the Sim Lab via `registry.tsx`).
- `src/content/diagrams/` — smaller lesson diagrams.
- `src/tools/` — anatomy, knots (`knots/data.tsx`), Beaufort scale, checklists.
- `src/lib/sailing.ts` — shared sailing maths (wind angles, points of sail, apparent wind, line bias).
- `src/lib/rules.ts` — right-of-way logic (RRS Part 2 / COLREGs).
- `src/lib/weather.ts` — Open-Meteo forecast for Matilda Bay.
