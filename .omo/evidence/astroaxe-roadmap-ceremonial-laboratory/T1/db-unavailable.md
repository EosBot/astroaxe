# T1 — QA failure: database unavailable during migration-status check (2026-08-26)

Simulated an unreachable database without deleting any data: paused the running `postgres`
container (`docker compose -f compose.yml -f compose.dev.yml pause postgres`), then ran
`docker compose -f compose.yml -f compose.dev.yml run --rm --no-deps app npx prisma migrate
status` (`--no-deps` so Compose would not auto-heal the dependency before the command ran).

```
Error: P1001: Can't reach database server at `postgres:5432`

Please make sure your database server is running at `postgres:5432`.
```

- The CLI fails typed and closed (`P1001`) instead of reporting a guessed "up to date" or "unknown
  but proceeding" state.
- No schema edit, migration deploy or generate step was attempted while the DB was unreachable —
  this task blocks on that state rather than guessing it.
- Recovery: `docker compose -f compose.yml -f compose.dev.yml unpause postgres`, confirmed
  `healthy` again via `docker compose ps` polling before continuing. No volume, data or other
  service was touched.
