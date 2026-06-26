# PASA Election System

A secure electronic ballot for the **Public Administration Students' Association (PASA) Executive Election** — Department of Public Administration, Faculty of Management & Communication Studies, **Oyo State College of Agriculture and Technology (OYSCATECH), Igbo-Ora**.

Built from the Claude Design prototype (kept in [`_design_reference/`](./_design_reference)) into a fully functional app.

## Features

- **Multiple elections over time** — create, run, and archive many elections from one admin console (Admin → Elections). Each election keeps its own positions, candidates, voter roster, votes and results. Open one for voting, close it when done, then start the next. At most one election is open at a time (opening a new one closes the previous), and past results stay viewable by switching which election you manage.
- **Voter flow** — matric-number verification → position-by-position ballot → review → sealed submission with a verification receipt.
- **One vote per matric**, enforced atomically in the database. Duplicate attempts are blocked and **flagged**.
- **Anonymous ballots** — votes are never linked to a voter's identity.
- **Candidate photos** — admins can upload a photo per candidate (JPG/PNG/WebP/GIF, ≤ 4 MB); voters see the photo on the ballot, review and manifesto, with a coloured-initials fallback when none is set. Photos are stored in the database, so they persist across container rebuilds.
- **Admin console** — overview/turnout, manage positions & candidates, upload the voter roster (CSV), live results, and white-label settings.
- **Observer portal** — read-only live results with CSV / Excel / PDF export.
- **Role-based auth** (Admin / Observer) with hashed passwords and signed session cookies.
- Polished UI matching the design, with **GSAP** entrance and results animations (respects `prefers-reduced-motion`).

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · PostgreSQL · GSAP · Docker.

---

## Quick start (local development)

Requires Node 22+, pnpm, and Docker (for the database).

```bash
pnpm install
cp .env.example .env            # adjust secrets if you like

docker compose up -d db         # starts Postgres on 127.0.0.1:5544
pnpm db:push                    # create the schema
pnpm db:seed                    # provisions the admin + observer accounts

pnpm dev                        # http://localhost:3000
```

The seed is intentionally minimal — it only creates the staff accounts. Elections (with their positions, candidates and roster) are built through the admin UI: sign in to **/admin → Elections → create**.

**Demo credentials (development seed):**

| Role     | Email                        | Password               |
|----------|------------------------------|------------------------|
| Admin    | `admin@oyscatech.edu.ng`     | `ChangeMe!Admin2026`   |
| Observer | `observer@oyscatech.edu.ng`  | `ChangeMe!Observer2026`|

> Don't have Docker? Point `DATABASE_URL` in `.env` at any Postgres (or MySQL — see below) and run `pnpm db:push && pnpm db:seed`.

---

## Deploying to a VPS (Docker Compose)

The whole stack (app + Postgres) runs with one command.

1. **Copy the project to your VPS** (git clone or `scp`).

2. **Create a `.env`** next to `docker-compose.yml` with production values:

   ```env
   POSTGRES_USER=pasa
   POSTGRES_PASSWORD=<a-strong-password>
   POSTGRES_DB=pasa_election
   AUTH_SECRET=<run: openssl rand -base64 48>
   ADMIN_EMAIL=admin@youfrom.edu.ng
   ADMIN_PASSWORD=<strong-admin-password>
   OBSERVER_EMAIL=observer@youfrom.edu.ng
   OBSERVER_PASSWORD=<strong-observer-password>
   SEED_ON_START=true        # load demo data on first boot; see note below
   APP_PORT=3000
   ```

3. **Build and start:**

   ```bash
   docker compose up -d --build
   ```

   On first boot the app applies the schema (`prisma db push`) and, if `SEED_ON_START=true`, seeds demo data. The app listens on `APP_PORT` (default `3000`).

4. **After the first successful boot, set `SEED_ON_START=false`** in `.env` and run `docker compose up -d` again, so restarts never reset the live election.

5. **Put it behind a reverse proxy** (Nginx/Caddy) for TLS. Example Nginx server block:

   ```nginx
   server {
     server_name vote.yourdomain.edu.ng;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

   Then issue a certificate with `certbot --nginx`. Cookies are marked `Secure` automatically in production (HTTPS required for login to persist).

### Running a real election

1. Sign in to **/admin → Elections** and create an election (it becomes the one you're managing). Set the institution/faculty/department and schedule in **Settings**.
2. In **Candidates**, create your positions and candidates, and upload a photo for each candidate (optional, but recommended so voters can recognise them).
3. In **Voter roster**, upload a CSV with columns `matric_number, full_name` (a template download is provided). **Uploading replaces this election's roster and clears its ballots**, so do this before voting opens.
4. On **Elections** (or the Overview control), click **Open voting**. Share the site link — voters use **Cast your vote**; observers watch **/observer**.
5. When voting ends, click **Close voting**. Results stay available. To run the next election, create another one and repeat — switch which election you manage any time with **Manage**.

---

## Using MySQL instead of Postgres

1. In `prisma/schema.prisma`, set `provider = "mysql"` in the `datasource` block.
2. Set `DATABASE_URL="mysql://user:pass@host:3306/pasa_election"`.
3. Run `pnpm db:push && pnpm db:seed`. (For Docker, swap the `db` service in `docker-compose.yml` for a `mysql:8` image.)

---

## Scripts

| Command          | Description                                            |
|------------------|--------------------------------------------------------|
| `pnpm dev`       | Start the dev server                                   |
| `pnpm build`     | Generate the Prisma client and build for production    |
| `pnpm start`     | Run the production build                                |
| `pnpm db:push`   | Apply the schema to the database                       |
| `pnpm db:seed`   | Seed demo data                                         |
| `pnpm db:reset`  | Wipe and re-seed (destructive)                         |

## Upgrading from a single-election version

The multi-election release adds an `Election` table and scopes all data to it. A **data-preserving migration** is provided so an existing single-election database keeps all of its voters, votes and results — the current election simply becomes "Election #1" (status CLOSED).

**Always back up first**, then run the migration once against the live database (while the app container is stopped, the `db` service stays up):

```bash
# 1. Back up
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F-%H%M).sql

# 2. Stop the app, apply the migration, bring the app back up
docker compose stop app
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  < prisma/upgrade-to-multi-election.sql
docker compose up -d --build app
```

The migration is transactional and guarded (it refuses to run twice). After it runs, `prisma db push` on boot is a no-op — the schema is already in sync, so no data is altered or dropped.

> For a throwaway/fresh database with no data worth keeping, you can instead just `pnpm db:reset` (destructive) or let the entrypoint create the schema on first boot.

## Security notes

- Always set a strong, unique `AUTH_SECRET` (≥ 32 chars) in production.
- Ballots are stored with no link to the voter; only `Voter.hasVoted` gates re-voting.
- Set `SEED_ON_START=false` once live so deploys/restarts don't reset data.

## Project structure

```
src/
  app/
    page.tsx                  Portal (role picker)
    vote/                     Voter flow (landing → verify → ballot → review → success/flag)
    admin/                    Admin login + console (overview, candidates, roster, results, settings)
    observer/                 Observer login + read-only results
    api/                      Route handlers (auth, ballot, voter, admin CRUD, results, export)
  components/                 UI: Logo, Icons, Reveal (GSAP), Toast, results bars, admin shell
  lib/                        db, auth (jose), guard, results, settings, theme, utils
prisma/
  schema.prisma              Data model
  seed.ts                    Demo data + admin/observer accounts
```
