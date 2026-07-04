# CLAUDE.md

Standing instructions for working in this repo. Full product spec is in
[`docs/menurate-spec.md`](docs/menurate-spec.md) — read Section 11 (Build Order) before starting
any new feature work; build order steps are done one at a time, in separate prompts, not all at
once, so the user can review each before the next starts.

## Environment quirks (don't rediscover these)

- **Node.js was installed mid-project via winget** (`OpenJS.NodeJS.LTS`). Every PowerShell tool
  call in a session started before that install won't have it on PATH. Prefix PowerShell commands
  that need `node`/`npm`/`npx` with:
  ```powershell
  $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
  ```
  If a plain `node -v` ever fails with "not recognized," try this refresh before assuming Node
  needs reinstalling.
- **No Docker on this machine.** `supabase start` (local Postgres) isn't available. All schema
  work goes straight to the linked live Supabase project via `npm run db:push`. There is no local
  dev database — be deliberate with migrations, and use `scripts/seed*.mjs`-style one-off scripts
  (service-role key) to seed/clean up test data directly against the live project.
- **Supabase CLI is linked** to the `menurate-production` project. `npx supabase migration new
  <name>` sometimes hangs in this non-interactive environment after creating the file — check
  `supabase/migrations/` for the new (empty) file and proceed to fill it in rather than waiting.

## Dev server

- The dev server is **not** left running between turns — stop it after verification
  (`Get-Process -Name node | Stop-Process -Force`) so it doesn't go stale across edits. Start it
  fresh whenever you (or the user) need to look at something:
  ```powershell
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev > dev-out.log 2>&1" -WindowStyle Hidden
  ```
  then poll `http://localhost:3000` until it responds before using it.

## Verifying changes

- Playwright is a devDependency specifically because `chromium-cli` isn't available in this
  environment. Use it to actually drive UI changes in a real browser before calling work done —
  don't rely on lint/build/typecheck alone.
- Wait for `networkidle` (or otherwise ensure hydration has completed) before interacting with a
  freshly-navigated page in a Playwright script — clicking immediately after `goto`/render can
  silently no-op on a Next.js page that hasn't finished hydrating yet. This has caused several
  false "it's broken" moments that turned out to be test-script timing, not app bugs.
- Any test data created against the live Supabase project (test accounts, seed rows used only for
  a one-off check) should be cleaned up afterward via the service-role key/admin API — this is a
  shared live project, not a disposable local database.
- Write one-off verification/debug scripts inside the project directory (not the OS temp dir) so
  `node` can resolve `node_modules` — then delete them before committing.

## Git

- Commit after each completed Build Order step, not mid-step.
- `.claude/` (settings, permissions) and `dev-out.log` are not part of the app — don't stage them
  as part of feature commits.
