Ground Zero — Per-Domain Assessment (Next.js)

Deterministic Big Five per-domain assessment. Client-only, no backend. Exports an audit JSON locally.

Dev

- pnpm install
- pnpm dev -p 3001

Build

- pnpm build
- pnpm start -p 3001

Deploy

- Push to GitHub, import into Vercel. Uses Turbopack in dev.

Structure

- app/ — App Router pages
- components/assessment — Main client component
- lib/bigfive — Constants and pure logic
- lib/crypto — SHA-256 wrapper
- styles/globals.css — Dark minimal tokens

Notes

- All logic is deterministic; no RNG.
- Data stays in the browser until you export JSON.


