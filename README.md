# Artsea

Artsea is a self-hosted portfolio website for a single visual artist, built as an engineering
thesis project. It is under active development and will consist of two parts:

- **Public portfolio** - a homepage with an artwork bento grid and individual artwork pages.
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

### App

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Start the development server                   |
| `npm run build` | Build the app for production                   |
| `npm run start` | Serve the production build (run `build` first) |

### Code quality

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run lint`         | Run ESLint (fails on any warning)                 |
| `npm run format`       | Format all files with Prettier                    |
| `npm run format:check` | Check formatting of tracked files without writing |
| `npx tsc --noEmit`     | Type-check the project                            |

> **Windows:** `npm run format:check` does not work out of the box. npm runs scripts through
> `cmd.exe`, which can't run the script's POSIX shell pipeline, and Git's default
> `core.autocrlf=true` checks files out with CRLF line endings, which Prettier reports as errors.
> Until this is fixed, run:
>
> ```bash
> npm run format:check --script-shell="C:\Program Files\Git\bin\bash.exe" -- --end-of-line auto
> ```

### Tests

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run test` | Run the Playwright tests |

The tests are database integration tests: they run against the database from `DATABASE_URL`
in `.env.local`, so the database must be running with an up-to-date schema. They also delete and
recreate data in it. To get the sample data back afterwards, run `npm run db:seed`.

To run a single file: `npx playwright test tests/seed-guard.spec.ts`.

### Database

| Command               | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `npm run db:up`       | Start the PostgreSQL container                           |
| `npm run db:down`     | Stop the container (data is kept in the volume)          |
| `npm run db:logs`     | Follow the database logs                                 |
| `npm run db:push`     | Sync the database schema with `db/schema.ts`             |
| `npm run db:generate` | Generate a migration from schema changes into `drizzle/` |
| `npm run db:migrate`  | Apply migrations from `drizzle/`                         |
| `npm run db:studio`   | Open Drizzle Studio to browse the database               |
| `npm run db:seed`     | Insert sample data (`-- --reset` replaces existing data) |

To start from a completely empty database, remove the volume and set it up again:

```bash
docker compose -f docker-compose.dev.yml down --volumes
npm run db:up
npm run db:push
npm run db:seed
```

## Project structure

```
app/
  (public)/        Public portfolio pages (homepage, /work/[id])
  admin/           Admin dashboard pages
  api/             Route handlers (e.g. database health check)
  layout.tsx       Root layout: <html>, fonts and default metadata
  globals.css      Tailwind theme
components/        Shared React components
db/
  schema.ts        Drizzle schema
  seed.ts          Sample data seed script
  fixtures/        Images used by the seed script
drizzle/           Generated SQL migrations
lib/               Utilities, admin routes, theme helpers
tests/             Playwright tests
types/             Shared TypeScript types
```

## Contributing

- Create a branch from `main` and open a pull request back into `main`.
- Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org):
  `type(scope): short imperative description`, e.g. `fix(header): align nav items`. Allowed
  types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`.
- Every pull request runs these checks in CI: commit messages, PR title, formatting and linting
  (on every commit), type check, and tests. Run `npm run format:check`, `npm run lint`,
  `npx tsc --noEmit` and `npm run test` locally before pushing.
