# T-Sailor

Visual study companion for the keelboat courses: Start Crewing, Start Helming,
Start Skippering, Spinnakers and Start Racing.

## Run it

```sh
pnpm docker:up         # docker compose up -d --build → http://<mac-mini>:8090
pnpm dev               # hot-reload dev server on the LAN
pnpm test              # sailing maths unit tests
pnpm smoke             # visit every route in the running container, fail on console errors
                       #   (needs T_SAILOR_USER / T_SAILOR_PASS for an existing account)
```

For local development run `pnpm dev:api` alongside `pnpm dev`; accounts and progress go to `./data/`.

## Users

There's no sign-up: everyone needs an account an admin creates. Each account has its own progress (completed lessons,
where they left off, checklists, theme), saved on the server so it follows them between devices.

Admins manage everyone from the **Admin** page (sidebar, or Profile → Manage users on a phone): add users, rename
them, set a new password, grant or remove admin, reset progress, or remove them. Admin only works from the LAN address
(`http://<host>:8090`): anything arriving through the Cloudflare tunnel is treated as a regular user, and the admin
API answers 404. Create the first admin from the CLI:

```sh
pnpm user add tarek --name "Tarek" --admin   # prompts for a password
pnpm user admin kim on               # or promote an existing user (off to demote)
pnpm user list
pnpm user passwd tarek               # reset a forgotten password (signs out their other devices)
pnpm user rename tarek --name "Tarek E."
pnpm user reset tarek                # wipe their progress
pnpm user remove tarek
```

`pnpm user …` runs inside the `api` container; use `pnpm user:dev …` against the local `./data/` instead. Data lives
in the `t-sailor-data` Docker volume (`users.json`, `progress/<user>.json`, and the cookie-signing `secret`) — back
that up. Users can change their own password on the Profile page.

## Where things live

- `src/content/<course>/<NN>-<slug>.mdx` — lessons. The number sets the order; `export const meta` sets the title,
  summary and minutes. Lessons can use any component listed in `src/content/mdxComponents.tsx` without importing it.
- `src/sims/` — interactive simulators (also shown in the Sim Lab via `registry.tsx`).
- `src/content/diagrams/` — smaller lesson diagrams.
- `src/tools/` — anatomy, knots (`knots/data.tsx`), Beaufort scale, checklists.
- `src/lib/sailing.ts` — shared sailing maths (wind angles, points of sail, apparent wind, line bias).
- `src/lib/rules.ts` — right-of-way logic (RRS Part 2 / COLREGs).
- `server/` — the zero-dependency accounts/progress API (`server.mjs`) and user admin CLI (`users.mjs`).
- `src/lib/session.ts` — sign-in state and syncing `src/lib/progress.ts` to the server.
- `src/lib/weather.ts` — Open-Meteo forecast for Matilda Bay.
