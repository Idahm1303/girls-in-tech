# Girls in Tech · TUT Faculty of ICT

The Girls in Tech (GiT) web application helps TUT Faculty of ICT students join
the community, complete their profile once, and access member areas.

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL 14 or newer

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. For Neon, run `neon init` and `neon deploy`; the CLI writes pooled
   `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED` values to `.env.local`.
   For another PostgreSQL host, copy `.env.example` to `.env` and set both
   connection strings. Set `AUTH_SECRET` to a unique random secret.
3. Generate the Prisma client and apply the database migration:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   Prisma loads `.env.local` for database commands. `DATABASE_URL` is used by
   the application for pooled connections; Prisma migrations use
   `DATABASE_URL_UNPOOLED` directly.
4. Load the development sample data:

   ```bash
   npm run db:seed
   ```

5. Start the website:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Testing accounts

The 16 completed sample student accounts are `sample.<campus><number>@gmail.com`,
where `<campus>` is `soshanguve`, `emalahleni`, `polokwane`, or `giyane`, and
`<number>` is 1 through 4. All use `ChangeMe123!`. The incomplete-profile
onboarding test account is `incomplete.student@gmail.com` and uses the same
password.

These are development/testing credentials only. Never use them in a deployed
environment. The seeded admin account uses `GirlsInTech2026!`. Seed mentor
accounts covering pending, approved, rejected, and needs-information states use
`ChangeMe123!`; the same password is for testing only.

Mentor application email delivery uses Resend. Configure `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, and `GIT_ADMIN_EMAIL` in the local environment to send
application and decision messages. Mentor profile photos are optional and are
uploaded after a mentor signs in; small images are resized and stored in the
PostgreSQL `StoredFile` table. Do not upload CVs or PDFs.

## Account-flow checks

- `npm test` runs student and mentor registration, access, and validation tests.
- `npm run lint` checks the application.
- `npm run build` creates the production build.

## Brand assets

- The institutional logo is omitted until the approved corporate logo is provided.
- GiT infinity mark: `public/brand/git-infinity.svg`.
- GiT motto: “Limitless minds. Infinite Code.”
- Pink and plum brand colors: `#C0266D` and `#642044`.
- Brand motto, hashtags, and logo paths live in `src/lib/brand.ts`.

## Database commands

- `npm run db:generate` regenerates the Prisma client.
- `npm run db:validate` validates the Prisma schema.
- `npm run db:migrate` applies pending development migrations.
- `npm run db:migrate:deploy` applies committed migrations to a deployed
  database such as the Neon production branch.
- `npm run db:seed` inserts or updates development sample data.

Mentor registration and admin approval are available. Mentor booking requests
and the mentor-side student directory remain for a later phase.
