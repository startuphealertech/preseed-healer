# PreSeedHealer

Source for **[preseedhealer.com](https://preseedhealer.com)**: a curated pre-seed fundraising platform connecting Indian startups with investors.

```
apps/
  web/   Next.js 16 (App Router, TypeScript, Tailwind v4): public site + /admin panel
  api/   Express 5 + Mongoose 9 REST API at /api/v1
packages/
  types/     Zod schemas + TS types shared by web and api (one source of validation)
  tsconfig/  Shared TS configs
deploy/      Nginx sample        ecosystem.config.cjs   PM2 process file
DEPLOY.md    Production setup and go-live checklist
```

## Quick start

Requirements: Node ≥ 22.9, MongoDB running locally (or an Atlas URI).

```bash
npm install
cp apps/api/.env.example apps/api/.env          # set MONGODB_URI, secrets, SEED_ADMIN_*
cp apps/web/.env.example apps/web/.env.local    # REVALIDATE_SECRET must match the API
npm run seed -w @preseedhealer/api              # admin user + starter content
npm run dev                                     # web http://localhost:3100 · api http://localhost:4000/api/v1
```

Admin panel: http://localhost:3100/admin (sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

Scripts: `npm run dev`, `npm run build`, `npm run typecheck`, `npm run dev:web`, `npm run dev:api`, `npm run seed -w @preseedhealer/api`.

## What's in it

**Public site** (mobile-first, SEO-first): Home, About, Startups, Investors (+ join form), Summit 2026, Phase 01/02, Apply (3-step form), Insights (list, pagination, categories, search, article, RSS), Partners, FAQ, Contact, 8 legal pages.

**Admin** (`/admin`): dashboard; applications, investor leads and messages with status, notes and CSV export; CRUD for articles (Markdown editor with live preview, image upload, SEO fields, FAQs), categories, partners, FAQs and legal pages; site settings (announcement bar, phase status, contact, socials); password change. Roles: `admin` (everything) and `editor` (content only).

**SEO**: per-page metadata + canonical via `buildMetadata()`; JSON-LD for Organization, WebSite, BreadcrumbList, Article, FAQPage and Event; dynamic sitemap, robots, RSS; auto-generated OG images per article; ISR with on-demand revalidation; one `<h1>` per page.

## How content flows

1. Pages are statically rendered with ISR. API fetches carry cache **tags** (`posts`, `post:<slug>`, `partners`, `faqs`, `pages`, `settings`).
2. An admin save → the API calls `POST /api/revalidate` on the web app with those tags, and the page is fresh within seconds.
3. The browser never calls the API directly: `/api/v1/*` on the web origin is rewritten to the API.

## Conventions

- Every page exports `metadata = buildMetadata({ title, path, ... })`. **`title` is required**: Next 16.4 drops the layout default title on ISR-regenerated pages.
- Validation lives in `packages/types`; forms (client) and routes (API) parse with the same Zod schema.
- Brand, nav and footer links: `apps/web/src/config/site.ts`. Design tokens: `apps/web/src/app/globals.css`.
- Seeded partners are **samples**: replace them before launch (see DEPLOY.md checklist).
