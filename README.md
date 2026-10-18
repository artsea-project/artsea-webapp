# Artsea

Artsea is a self-hosted portfolio website for a single visual artist, built as an engineering
thesis project. It is under active development and will consist of two parts:

- **Public portfolio** - a homepage with an artwork bento grid, individual artwork pages and an
  about page.
- **Admin dashboard** (`/admin`) - where the artist manages their works, categories, profile and
  the site's appearance.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with React 19 and TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-based theme in `app/globals.css`), with
  [shadcn/ui](https://ui.shadcn.com) configured for UI components
- [PostgreSQL 16](https://www.postgresql.org) with [Drizzle ORM](https://orm.drizzle.team)
- [Playwright](https://playwright.dev) for tests
- ESLint and Prettier for code quality

## Prerequisites

- [Node.js](https://nodejs.org) 22 (the version used in CI) and npm
- [Docker](https://www.docker.com) with Docker Compose, for the local PostgreSQL database
- Port `5432` free on your machine (or change the port mapping in `docker-compose.dev.yml` and
  `DATABASE_URL` accordingly)

## Getting started

1. **Clone the repository and install dependencies**

    ```bash
    git clone https://github.com/artsea-project/artsea-webapp.git
    cd artsea-webapp
    npm install
    npx playwright install chromium
    ```

2. **Create your local environment file**

    ```bash
    cp .env.example .env.local
    ```

    The default `DATABASE_URL` already points at the Docker database from the next step. All
    tooling (Next.js, Drizzle, the seed script and Playwright) reads `.env.local`.

3. **Start the database**

    ```bash
    npm run db:up
    ```

    This starts a PostgreSQL 16 container (`artsee-postgres-dev`) with a persistent volume.

4. **Create the schema**

    ```bash
    npm run db:push
    ```

    It prints the SQL it is about to run and asks for confirmation, so answer "Yes" in the prompt.

    Use `db:push` rather than `db:migrate` for now: the migrations in `drizzle/` are out of date
    with the schema and will be regenerated (#44).

5. **Seed sample data**

    ```bash
    npm run db:seed
    ```

    This inserts a sample artist, profile, site settings and a set of artworks with images from
    `db/fixtures/`. The script refuses to overwrite a database that already contains a different
    user; pass `--reset` to replace existing data:

    ```bash
    npm run db:seed -- --reset
    ```

6. **Run the app**

    ```bash
    npm run dev
    ```

    - Portfolio: [http://localhost:3000](http://localhost:3000)
    - Admin dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)
    - Database health check:
      [http://localhost:3000/api/health/db](http://localhost:3000/api/health/db)

## Commands

Scripts run with `npm run <script>`; type-check with `npx tsc --noEmit`.

| Script                      | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `dev`, `build`, `start`     | Dev server, production build, serve the build                 |
| `lint`                      | ESLint (fails on any warning)                                 |
| `format`, `format:check`    | Format with Prettier, or only check formatting                |
| `test`                      | Playwright tests                                              |
| `db:up`, `db:down`          | Start or stop the database container (data stays in a volume) |
| `db:push`                   | Sync the database schema with `db/schema.ts`                  |
| `db:generate`, `db:migrate` | Generate or apply migrations in `drizzle/`                    |
| `db:studio`, `db:logs`      | Browse the database in Drizzle Studio, follow its logs        |
| `db:seed`                   | Insert sample data (`-- --reset` replaces existing data)      |

Tests run against the database from `.env.local` and overwrite its data; run `npm run db:seed`
afterwards to get the sample data back. To start from an empty database, run
`docker compose -f docker-compose.dev.yml down --volumes` and repeat steps 3-5.

> **Windows:** `format:check` needs a POSIX shell and fails on CRLF line endings, so run it as:
>
> ```bash
> npm run format:check --script-shell="C:\Program Files\Git\bin\bash.exe" -- --end-of-line auto
> ```

## Contributing

- Branch from `main` and open a pull request back into `main`.
- Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org), e.g.
  `fix(header): align nav items`.
- CI checks commit messages, the PR title, formatting, lint, types and tests, so run those locally
  before pushing.
