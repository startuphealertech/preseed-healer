# Website QA Audit Report: PreSeedHealer

| | |
|---|---|
| **Audit date** | 10 Nov 2026 |
| **Environment** | Local dev: web `http://localhost:3100` (Next.js 16.4.3 dev / Turbopack), API `http://localhost:4000/api/v1` (Express 5, `tsx watch`), MongoDB 7.0.20 (local, seeded with `npm run seed`) |
| **Starting URL** | http://localhost:3100/investors |
| **Branch / commit** | `main` @ `9fd12af` (no changes made, nothing committed) |
| **Browser** | Google Chrome 157 (headless, isolated profile), driven through the DevTools Protocol |
| **Viewports** | 1440×900 · 1280×800 · 768×1024 · 390×844 (mobile emulation + touch) |
| **Method** | Source review → automated crawl of every route at 4 viewports → scripted click/keyboard/form tests in a real browser with outcome assertions → API tests through the same `/api/v1` proxy the site uses → database verification with `mongosh` |

> **How to read the statuses:** a test is **PASS** only when the actual result was verified, for example the URL changed to the right page, the DB row exists with the right values, or the count of visible cards matched the filter. Clicking alone never counted as a pass. Wherever a first run failed because of a mistake in my own test script (wrong selector, etc.), I fixed the script and re-ran it, and the report lists only the verified result.

---

## A. Project overview

### Technologies

| Layer | Stack |
|---|---|
| Monorepo | npm workspaces + Turborepo 2 |
| Frontend (`apps/web`) | Next.js 16.4 App Router, React 19.3, TypeScript 5.9, Tailwind CSS v4 (+ typography), `marked` + `sanitize-html` for Markdown |
| Backend (`apps/api`) | Express 5.3, Mongoose 9 (MongoDB), Zod 4, JWT (`jsonwebtoken`) in an HttpOnly cookie, bcryptjs, multer (uploads), nodemailer, helmet, express-rate-limit, compression, morgan |
| Shared (`packages/types`) | Zod schemas + TS types used by **both** the forms and the API (one source of validation) |
| Integrations | SMTP email (optional; logs to console when unset), Google Analytics 4 (optional, consent-gated), on-demand ISR revalidation (API → `POST /api/revalidate` on web) |

### Architecture
- The browser never calls the API directly. `/api/v1/*` on the web origin is rewritten to Express (`next.config.ts`), so admin cookies stay first-party.
- Public pages are server-rendered with cache tags. Admin edits trigger `revalidateTag()` through a shared secret. **Verified working:** edits appeared on the public site within 1.5 s.
- Auth: `psh_session` JWT cookie (HttpOnly, SameSite=Lax, 7 days). `proxy.ts` (Next middleware) only checks that the cookie *exists*; the API verifies the token on every admin call.
- Roles: `admin` (everything) and `editor` (content only; applications, investor leads and messages are admin-only).

### Routes discovered

| Group | Routes | Count |
|---|---|---|
| Public pages | `/`, `/about`, `/startups`, `/investors`, `/investors/join`, `/summit-2026`, `/phase-01`, `/phase-02`, `/apply`, `/faq`, `/contact`, `/partners`, `/insights` | 13 |
| Dynamic content | `/insights/[slug]` (3 posts), `/insights/category/[slug]` (3), `/insights/page/[page]`, `/insights/search?q=`, `/legal/[slug]` (8) | 16 (+ variants) |
| Machine files | `/insights/feed.xml`, `/sitemap.xml`, `/robots.txt` | 3 |
| Legacy redirects | `/news`, `/blog`, `/blog/:slug`, `/event`, `/legal/application-selection-disclaimer` | 5 |
| Not-found | site-wide + per-dynamic-route `notFound()` | 1 page |
| Admin (protected) | `/admin/login`, `/admin` (dashboard), `/admin/applications[/id]`, `/admin/investors[/id]`, `/admin/messages[/id]`, `/admin/[resource]` + `/new` + `/[id]` for posts, categories, partners, faqs, pages, plus `/admin/settings`, `/admin/account` | 13 screens |
| Next API routes | `POST /api/revalidate` (secret), `POST /api/preview` (admin Markdown preview) | 2 |
| Express API | Public: health, settings, posts, categories, partners, faqs, pages, uploads, `POST /applications`, `POST /investor-interests`, `POST /contact`, auth. Admin: dashboard, CRUD for posts/categories/partners/faqs/pages, media, settings, applications/investor-interests/messages (+ CSV) | ~45 endpoints |

### Main modules
1. **Marketing site:** home, about, startups, investors, summit, phases, partners, FAQ.
2. **Lead capture:** a 3-step startup application, an investor-interest form and a contact form (with a honeypot, rate limiting and Zod validation on both sides).
3. **Insights (blog):** listing, categories, search, articles with share buttons, RSS, JSON-LD.
4. **Legal:** 8 CMS-managed pages.
5. **Admin panel:** dashboard, submissions management with status, notes and CSV export, content CRUD, Markdown editor with live preview, image uploads, site settings, account.

---

## B. Page-by-page testing

**Every public page below loaded at all 4 viewports with 0 JavaScript exceptions, 0 failed API requests, exactly one `<h1>`, a meta description, a canonical tag, no broken images and no unlabelled form fields.** Opening each URL directly (a fresh load, which is the same as a refresh) returned the expected HTTP status. Load times on the dev server averaged **123 ms** per page (max 269 ms, on the first cold request). The site contains no `<img>` elements: the logo is SVG and seeded content has no cover images.

| # | Page | URL | Load | UI / content | Navigation & interactions | API / backend | Responsive | Issues |
|---|---|---|---|---|---|---|---|---|
| 1 | **Investors** | `/investors` | ✅ 200 | ✅ Hero, 3 benefit cards, partner directory (6 investor-facing partners), CTA banner | ✅ "Join as an investor" (hero + banner) → `/investors/join`; "See the network" scrolls to `#network`; 7 filter chips each show exactly the matching cards (6/6, then 1/1 for each type), with `aria-pressed` and a live-region announcement; breadcrumbs correct | ✅ Partners rendered server-side from DB | ✅ all 4 (chip row scrolls horizontally on mobile by design) | Placeholder "Sample …" partners (config); BUG-06, BUG-07 (site-wide) |
| 2 | Home | `/` | ✅ 200 | ✅ Hero + live programme status panel, platform, 6 features, journey (Phase 01 open / Phase 02 coming soon), summit banner, 3 latest insights, ecosystem strip, CTA | ✅ 13 in-page links all resolve | ✅ settings, posts, partners from DB | ✅ | Ecosystem strip shows 8 sample partners (config) |
| 3 | About | `/about` | ✅ 200 | ✅ | ✅ 4 links resolve | n/a | ✅ | none |
| 4 | Startups | `/startups` | ✅ 200 | ✅ | ✅ 4 links resolve | ✅ | ✅ | none |
| 5 | Join as investor | `/investors/join` | ✅ 200 | ✅ Form | See §C (13 tests) | ✅ Saves to `investorinterests` | ✅ | BUG-04, BUG-05 |
| 6 | Summit 2026 | `/summit-2026` | ✅ 200 | ✅ (dates/venue "to be announced") | ✅ 5 links resolve | n/a | ✅ | none |
| 7 | Phase 01 | `/phase-01` | ✅ 200 | ✅ Status "Open" from settings | ✅ 5 links | ✅ | ✅ | none |
| 8 | Phase 02 | `/phase-02` | ✅ 200 | ✅ "Coming soon" | ✅ 5 links | ✅ | ✅ | none |
| 9 | Apply | `/apply` | ✅ 200 | ✅ 3-step wizard + tips | See §C (11 tests) | ✅ Saves to `applications`, returns ref code | ✅ | none |
| 10 | FAQ | `/faq` | ✅ 200 | ✅ 10 Q&As in 4 groups | ✅ Native `<details>` accordions open and close; answers visible | ✅ from DB | ✅ | none |
| 11 | Contact | `/contact` | ✅ 200 | ⚠️ Form renders; **no email, phone or address shown** (settings empty) | ✅ `?subject=partnership` / `?subject=startup` preselect subject; 5 links | ✅ Saves to `contactmessages` | ✅ | Pending config (contact details) |
| 12 | Partners | `/partners` | ✅ 200 | ✅ 8 partners | ✅ 9 filter chips all show matching counts; "become a partner" → `/contact?subject=partnership` | ✅ | ✅ | Sample partners (config) |
| 13 | Insights | `/insights` | ✅ 200 | ✅ 3 post cards, category links, search box | ✅ Card → article; category → filtered list (1 post); search submits | ✅ | ✅ | Pagination not testable (only 3 posts) |
| 14–16 | Articles | `/insights/pre-seed-pitch-deck-guide`, `/insights/dpiit-startup-recognition-guide`, `/insights/what-happens-after-you-apply` | ✅ 200 | ✅ Body, TOC, JSON-LD (Article, BreadcrumbList, FAQPage) | ✅ Share links (LinkedIn/X/WhatsApp, `noopener`); "Copy link" copies URL + shows "Copied" | ✅ | ✅ | LinkedIn returns 403 to automated link checks (bot blocking, not a broken link) |
| 17–19 | Categories | `/insights/category/{fundraising, government-schemes, programme-updates}` | ✅ 200 | ✅ 1 post each | ✅ | ✅ | ✅ | none |
| 20 | Paged listing | `/insights/page/1` → 308 `/insights`; `/insights/page/2` → 404 | ✅ correct | ✅ | n/a | ✅ | ✅ | none |
| 21 | Search | `/insights/search` (empty, `?q=pitch`, `?q=zzzznotfound`) | ✅ 200 | ✅ Prompt / 1 result / "No results for …" | ✅ query kept in box | ✅ | ✅ | XSS payload safely escaped |
| 22–28 | Legal (7) | `/legal/{privacy-policy, terms-and-conditions, refund-policy, disclaimer, application-selection, intellectual-property, contact-grievance}` | ✅ 200 | ⚠️ "Starter template" notice; Contact & Grievance has `[Grievance Officer name]` placeholder | ✅ legal sidebar nav | ✅ | ✅ | Pending legal content |
| 29 | Cookie policy | `/legal/cookie-policy` | ✅ 200 | ✅ | ✅ | ✅ | ❌ **Mobile: page 154 px wider than screen** | **BUG-03** |
| 30 | 404 | any unknown URL, unknown post/category/legal slug | ✅ 404 status | ✅ Custom page with header/footer + links to Home and Insights | ✅ | n/a | ✅ | none (the only console message is Chrome logging the 404 status itself) |
| 31 | RSS / sitemap / robots | `/insights/feed.xml`, `/sitemap.xml`, `/robots.txt` | ✅ 200, correct content types | ✅ 3 RSS items; sitemap lists all 27 public URLs; robots disallows `/admin` and `/api/` | n/a | ✅ | n/a | URLs use `localhost` until `NEXT_PUBLIC_SITE_URL` is set (expected) |
| 32 | Legacy redirects | `/news`, `/blog` → `/insights`; `/event` → `/summit-2026`; `/legal/application-selection-disclaimer` → `/legal/application-selection` | ✅ 308 | n/a | ✅ | n/a | n/a | none |

### Admin panel

| Screen | URL | Status | Notes |
|---|---|---|---|
| Login | `/admin/login` | ✅ | Labelled fields; empty submit → "Enter a valid email"; wrong password → "Incorrect email or password"; success → returns to `?next=` target. Signed-in visit is not redirected (P-03) |
| Dashboard | `/admin` | ✅ | Stat cards match DB counts exactly (verified with `mongosh`); recent applications; quick links |
| Applications | `/admin/applications`, `/[id]` | ✅ | List, search, status filter, detail view (pitch-deck link etc.), status buttons with "Marked as …" toast, notes save, "Export CSV" |
| Investor leads | `/admin/investors` | ✅ | List, search, status update, CSV export |
| Messages | `/admin/messages` | ✅ | Unread filter, mark as read. No CSV export (P-05) |
| Insights / Categories / Partners / FAQs / Legal pages | `/admin/{posts,categories,partners,faqs,pages}` | ✅ | Lists load from DB; new-article form validates; Write/Preview Markdown tab renders sanitized HTML |
| Settings | `/admin/settings` | ✅ | Loads; saving through the API updates the public announcement bar immediately (then restored) |
| Account | `/admin/account` | ✅ loads | Password change **not tested** (would change the real admin password) |
| Mobile (390 px) | all | ✅ | Menu drawer opens with 13 links; no horizontal overflow on dashboard or applications table |

---

## C. Functionality testing

**Totals: 159 functional tests. PASS 138 · FAIL 6 · PARTIAL 4 · NOT TESTED 11.**
In addition, the page-load/responsive matrix ran **37 HTML routes × 4 viewports = 148 checks: 147 PASS, 1 FAIL** (BUG-03).

### C1. Header, navigation, footer

| Test | Status | Evidence |
|---|---|---|
| Desktop nav: About / Startups / Investors / Summit 2026 / Insights / Partners (6 tests) | PASS ×6 | Each click → correct URL, correct `<h1>`, `aria-current="page"` on the active item |
| Logo returns home | PASS | → `/` |
| Header "Apply now" | PASS | → `/apply` |
| Announcement bar link | PASS | → `/phase-01` |
| Browser back / forward | PASS | back → `/investors`, forward → `/about` |
| All 22 footer links resolve | PASS | every link HTTP 200 |
| Footer link click navigates | PASS | "Contact" → `/contact` |
| In-page links on 9 content pages (/, about, startups, summit, phase-01, phase-02, partners, contact, apply) | PASS ×9 | 0 broken links, 0 missing anchors |
| Site-wide link check (59 unique links incl. external) | PASS | Only "failures" are 3 LinkedIn share URLs answering 403 to a non-browser client (LinkedIn bot protection) |
| Custom 404 page | PASS | header/footer + recovery links |

### C2. Mobile

| Test | Status | Evidence |
|---|---|---|
| Menu opens, 7 links, body scroll locked, focus to first link | PASS | `aria-expanded=true`, `overflow:hidden`, focus "About" |
| Escape closes, unlocks scroll, returns focus to toggle | PASS | |
| Backdrop tap closes | PASS | |
| Link navigates and drawer auto-closes | PASS | → `/insights`, `aria-expanded=false` |
| "Apply now" in drawer | PASS | → `/apply` |
| Filter chips scroll sideways, page does not | PASS | toolbar `scrollWidth` 1205 > 390; page 0 overflow |
| Announcement text readable at 390 px | **FAIL** | Truncated with an ellipsis, see BUG-06 |

### C3. Investors page

| Test | Status | Evidence |
|---|---|---|
| "See the network" scrolls to `#network` | PASS | hash `#network`, section top 96 px (under sticky header) |
| 7 partner filter chips | PASS | All 6/6, each type 1/1, live region "Showing 1 Angel Investors" etc. |
| Hero CTA "Join as an investor" | PASS | → `/investors/join` |
| Bottom CTA banner | PASS | both CTAs → `/investors/join` |
| Breadcrumbs | PASS | Home → `/`, Investors (current) |

### C4. FAQ, Insights, Partners

| Test | Status | Evidence |
|---|---|---|
| FAQ accordions open/close (10) | PASS | answer visible when open |
| FAQ groups from DB | PASS | Applying, General, Investors & partners, Selection |
| Insights listing shows all published posts | PASS | 3 cards |
| Card → article with body + JSON-LD | PASS | 1,897 chars body; Article/BreadcrumbList/FAQPage |
| Share links built with article URL + `noopener` | PASS | |
| "Copy link" | PASS | clipboard = article URL; "Copied" → resets after 2 s |
| Category link filters posts | PASS | `/insights/category/fundraising` → 1 post |
| Search returns matches | PASS | `q=pitch deck` → 1 result, query kept |
| Search with no matches → empty state | PASS | "No results for "zzzznotfound"" |
| Search page without query | PASS | shows prompt + all posts |
| Search query escaping (XSS) | PASS | `<script>` / `onerror` payload not executed |
| Partners page filter (9 chips) | PASS | counts match for every chip |
| UI pagination controls | NOT TESTED | Only 3 posts exist (fewer than one page), so no pager renders. `/insights/page/2` correctly 404s |

### C5. Forms

**Investor form (`/investors/join`)**

| Test | Status | Evidence |
|---|---|---|
| Empty submit → 7 required errors, **no request sent** | PASS | 0 network requests |
| Focus moves to first invalid field | PASS | `name` |
| Invalid email rejected | PASS | "Enter a valid email" |
| Invalid phone (`abc123`) rejected | PASS | "Enter a valid phone number" |
| Error clears on edit | PASS | |
| Phone with no real digits (`1-------`) rejected | **FAIL** | accepted, see BUG-05 |
| LinkedIn without `https://` rejected | PASS | "Enter a valid URL (https://…)" |
| Sector chips toggle | PASS | `aria-pressed` on/off |
| Consent required | PASS | "Please accept to continue" |
| Valid submission → success + saved | PASS | UI "Thanks, we'll be in touch."; DB row with `status:new`, `consentAt` |
| Success "Back to investors" | PASS | → `/investors` |
| Duplicate submission detected | **FAIL** | 2 identical rows stored, see BUG-04 |
| Double-click guard | PARTIAL | button disabled while submitting; not stress-tested, and there is no server-side dedupe |

**Contact form (`/contact`)**

| Test | Status | Evidence |
|---|---|---|
| Empty submit → errors, no request | PASS | |
| Invalid email + too-short message | PASS | |
| `?subject=` preselects subject | PASS | |
| Valid submission (phone optional) → saved | PASS | UI "Message sent…"; DB `subject:partnership`, `read:false` |
| 429 rate-limit message shown to user | PASS | "Too many submissions. Please try again later." |

**Startup application (`/apply`, 3 steps)**

| Test | Status | Evidence |
|---|---|---|
| Step 1 empty → only step-1 errors, no request | PASS | |
| Cannot skip ahead via step tabs | PASS | Step 2 tab disabled |
| Valid step 1 → step 2 | PASS | |
| Step 2 empty → 7 step-2 errors | PASS | |
| Founded year 1980 rejected | PASS | "Enter a valid year" (min 1990) |
| "← Back" keeps data | PASS | |
| Completed step tab goes back, data kept | PASS | |
| Pitch-deck URL + consent required | PASS | |
| Valid submission → reference code + saved | PASS | `PSH-26-8MQ5JM` shown and stored; confirmation email written to console log (`[mail:dev]`) since SMTP is unset |
| Duplicate application blocked (case-insensitive name) | PASS | "You've already applied with this startup for this phase…" (409); still 1 row |

### C6. Backend / API

| Test | Status | Evidence |
|---|---|---|
| Server validates when the browser is bypassed | PASS | 400 + 7 field errors |
| Honeypot: bot gets fake 201, nothing saved | PASS | 0 rows |
| Rate-limit headers on form endpoints | PASS | `"8-in-1hr"` |
| One shared limit across all 3 forms, including failed requests | PARTIAL | Confirmed behaviour, see P-01 |
| Wrong password / unknown email → identical 401 (no account enumeration; timing equalised in code) | PASS ×2 | |
| Malformed login → 400 | PASS | |
| Valid login → session cookie | PASS | HttpOnly, SameSite=Lax (`Secure` added in production) |
| Login rate limiter | PASS | `"10-in-15min"` |
| All 12 admin endpoints reject anonymous requests | PASS | 401 each |
| Forged JWT rejected | PASS | 401 |
| All 12 admin endpoints return 200 for admin | PASS | |
| Dashboard stats equal DB counts | PASS | apps 1, investors 2, msgs 1, unread 1, published 3 |
| Applications: search, status + notes persist, invalid status 400, filter, bad filter 400 (not 500), malformed id 400, unknown id 404, CSV export | PASS ×8 | `text/csv`, `attachment; filename="preseedhealer-applications-2026-11-10.csv"` |
| Investor leads: list/search/status, CSV | PASS ×2 | |
| Messages: unread filter + mark read | PASS | |
| Messages CSV export | NOT TESTED | No such endpoint exists (P-05) |
| Posts: create draft; draft not public (404); publish → live on article + listing; edit → public page updates (revalidation); duplicate slug auto-suffixed (`-2`); Markdown `<script>` sanitized; delete → 404 + removed from listing | PASS ×7 | All on QA-created posts, deleted afterwards |
| PATCH requires full document | PARTIAL | Partial body → 400 (P-04) |
| FAQs: create → on `/faq`; delete → gone | PASS | |
| Partners: create → on `/investors`; delete | PASS | |
| Settings: save → announcement updates on public site; restored exactly | PASS | |
| Media: PNG upload served as `image/png`; SVG rejected; 6 MB rejected ("Image must be under 5 MB") | PASS ×3 | |
| Editor role: content allowed; applications, leads, messages and CSV → 403; settings save → 403 | PASS ×2 | |
| Editor dashboard hides applicant personal data | **FAIL** | see BUG-02 |
| Token invalid after logout | **FAIL** | see BUG-01 |
| Deleted user's token stops working | **FAIL** | see BUG-01 |
| 5xx errors during the whole audit | PASS | API log: 0 responses ≥ 500 (197×200, 13×201, 13×400, 18×401, 5×403, 16×404, 1×409, 1×429, all from deliberate tests) |
| Type check (`npm run typecheck`, 3 packages) | PASS | 0 errors |

### C7. Admin UI

| Test | Status |
|---|---|
| Protected page → login with `?next=` | PASS |
| Login page labelled + no console errors | PASS |
| Empty / wrong-password login messages | PASS ×2 |
| Login returns to `?next=` target | PASS |
| `?next=https://external…` cannot redirect off-site | PASS (lands on `/admin`) |
| Sidebar: 12 pages load with heading, active state, 0 exceptions, 0 failed requests | PASS ×12 |
| Applications list → detail with full record | PASS |
| Status buttons update DB + toast | PASS |
| Save notes | PASS |
| Export CSV button → export endpoint | PASS |
| Markdown Write/Preview (sanitized) | PASS |
| New article validation | PASS |
| Mobile admin drawer + no overflow (2) | PASS ×2 |
| Sign out → login; pages protected again | PASS |
| Signed-in visit to `/admin/login` redirects | PARTIAL (stays on login form; P-03) |
| Delete application / lead / message buttons | NOT TESTED: destructive. Delete was verified only on records the audit created |

### C8. Accessibility (basic)

| Test | Status | Evidence |
|---|---|---|
| "Skip to content" is the first Tab stop and works | PASS | → `#main` |
| Visible focus ring | PASS | 2px solid outline |
| One `<h1>` per page, `lang` set | PASS | all pages |
| Form fields labelled; errors linked via `aria-describedby`, `aria-invalid`, `role=alert` | PASS | 0 unlabelled fields on any page |
| Buttons/links have accessible names | PASS | 0 nameless controls |
| Duplicate IDs | PASS | none |
| Text below 12 px | Note | 3 elements: the logo sub-label and "Soon" badge at 10.4 px (BUG-07) |

### C9. Not tested (with reasons)

| Item | Reason |
|---|---|
| Production build (`npm run build` / `start`) and production performance | A build writes into `.next`, which the running dev server uses. Recommended as a separate step |
| Real email delivery and team notifications | SMTP is not configured (by design in dev); emails are written to the console. `NOTIFY_EMAILS` is empty |
| Cookie-consent banner + GA4 loading | The banner renders only when `NEXT_PUBLIC_GA_ID` is set (it is empty) |
| Admin password change | Would change the real seeded admin password |
| Delete buttons for applications, leads and messages | Destructive (see C7) |
| UI pagination | Not enough content (see C4) |
| Editor-role admin **UI** (sidebar hiding) | Roles were verified at the API level; the UI was not exercised as an editor |
| Other browsers (Safari, Firefox), real devices | Only Chromium was available headlessly; viewports were emulated |
| Colour contrast and screen-reader testing | Needs manual or axe/Lighthouse tooling, which isn't installed (no new dependencies without approval) |
| Load / stress testing | Out of scope for a local audit |

---

## D. Bug report (confirmed issues)

### BUG-01: Admin sessions cannot be revoked (logout, user deletion or role change don't invalidate the token)
- **Severity:** High (security)
- **Page/URL:** All `/api/v1/admin/*` endpoints; `/admin` panel
- **Feature:** Authentication / session management
- **Description:** `requireAuth` (`apps/api/src/middleware/auth.ts:42-53`) trusts the JWT's `sub` and `role` without checking the database. Logout only clears the cookie in the browser (`clearSession`); the token itself stays valid for `SESSION_DAYS` (7 days). Deleting a user, demoting an admin to editor, or changing the password does not end existing sessions.
- **Steps to reproduce:**
  1. Log in (as a QA editor account created for this test) and keep the `psh_session` cookie value.
  2. Call `POST /api/v1/auth/logout`.
  3. Call `GET /api/v1/admin/posts` with the saved cookie.
  4. Delete the user from MongoDB and call the endpoint again, then `POST /api/v1/admin/faqs`.
- **Expected:** 401 after logout and after the account is deleted.
- **Actual:** After logout → **200**. After deleting the user → list **200**, create FAQ **201** (the deleted account could still write content). Only `/auth/me` returns 401 ("Account no longer exists").
- **Evidence:** `{"logoutClearsCookie":true,"reuseAfterLogout":200}` · `{"listPosts":200,"me":401,"createFaq":201}`. The test FAQ was removed afterwards.
- **Possible cause / fix direction:** Stateless JWT with no server-side check. Options: look up the user (and current role) in `requireAuth`; add a `tokenVersion`/`passwordChangedAt` claim checked on each request; shorten token lifetime.

### BUG-02: Editor role receives applicant personal data through the dashboard
- **Severity:** Medium (privacy / authorisation)
- **Page/URL:** `/admin` → `GET /api/v1/admin/dashboard`
- **Feature:** Role-based access
- **Description:** Applications, leads and messages are guarded with `requireAdmin` ("Personal data: admins only", `routes.ts`), but the dashboard route (`apps/api/src/modules/dashboard/dashboard.routes.ts`) returns `recentApplications` (founder name, startup name, sector, status, ref code) and submission counts to **any** signed-in user, editors included.
- **Steps:** Sign in as an `editor` → `GET /api/v1/admin/dashboard`.
- **Expected:** Editors don't receive applicant data (or the field is omitted for editors).
- **Actual:** `recentApplications` contains 1 entry (founder "QA Test Founder") for the editor.
- **Evidence:** `{"recentApplicationsForEditor":1,"applicationsTotal":1}`. Clicking "View all" from there leads to a 403 for editors, so the UI is inconsistent too.
- **Possible cause:** The dashboard router is mounted under `requireAuth` only; there's no role check on the submissions portion.

### BUG-03: Cookie Policy page scrolls horizontally on mobile (tables in Markdown content break the layout)
- **Severity:** Medium (layout / mobile UX)
- **Page/URL:** `/legal/cookie-policy` at 390×844 (any legal or article page whose content contains a table)
- **Feature:** Responsive layout of CMS content
- **Description:** The page renders **544 px wide on a 390 px screen**, a 154 px horizontal scroll. Hero and footer stop short of the right edge while the content overflows (visible in the screenshot).
- **Steps:** Open `/legal/cookie-policy` on a phone or at 390 px width; swipe left.
- **Expected:** Only the table scrolls inside its `.table-wrap` (`overflow-x: auto`).
- **Actual:** The whole page scrolls sideways.
- **Evidence:** `document.documentElement.scrollWidth = 544`; `.article` computed width 512 px inside a 358 px grid column; `.table-wrap` has `overflow-x:auto` but never gets narrower than the table.
- **Possible cause:** `.article` is a grid item (`grid lg:grid-cols-[1fr_15rem]`) with the default `min-width: auto`, so it grows to the table's `min-w-[32rem]` (`globals.css:136`). Giving the grid child `min-width: 0` (`min-w-0`) would let the wrapper scroll. The same pattern likely affects articles with tables.

### BUG-04: Investor-interest form accepts unlimited duplicate submissions
- **Severity:** Medium (data quality; duplicate team notifications)
- **Page/URL:** `/investors/join` → `POST /api/v1/investor-interests`
- **Feature:** Investor lead capture
- **Description:** The applications endpoint rejects duplicates (409), but the investor endpoint has no duplicate check, so the same person submitting twice creates two leads (and two team alert emails once SMTP is configured).
- **Steps:** Submit the form with the same name, email and phone twice.
- **Expected:** The second submission is rejected or merged with a friendly message (like the application form's "already applied").
- **Actual:** 201 both times; **2 rows** in `investorinterests` for `qa-test+investor@example.com`.
- **Possible cause:** `submissions.routes.ts` `POST /investor-interests` has no `exists()` check.

### BUG-05: Phone validation accepts values without real digits
- **Severity:** Low
- **Page/URL:** `/investors/join`, `/apply`, `/contact` (shared `PhoneSchema`)
- **Feature:** Form validation
- **Description:** `^\+?[0-9][0-9 ()-]{7,18}$` (`packages/types/src/common.ts`) needs only **one** digit. `1-------` was accepted in testing (the client and the API use the same schema); by the same regex, inputs like `1 ( ) ( ) -` would pass too.
- **Steps:** Enter `1-------` as the phone number and submit.
- **Expected:** "Enter a valid phone number".
- **Actual:** Accepted.
- **Possible cause:** The regex counts separators as valid characters; it should require a minimum number of digits (e.g. strip non-digits and check for 10–15).

### BUG-06: Announcement bar text is cut off on mobile
- **Severity:** Low (content visibility)
- **Page/URL:** All public pages at 390 px
- **Feature:** Announcement bar
- **Description:** The text "Phase 01 applications open · Open until further notice" is single-line `truncate`, so phones show "PHASE 01 APPLICATIONS OPEN · OPEN UNTIL FURTHE…" and lose the deadline part, which is the key information.
- **Evidence:** `{"truncated":true}` (`scrollWidth > clientWidth`); mobile screenshots.
- **Possible cause:** `AnnouncementBar.tsx:14` `className="truncate"`; allow wrapping on small screens or use a shorter mobile text.

### BUG-07: Logo shows the brand name twice (tiny duplicate sub-label)
- **Severity:** Low (visual / content)
- **Page/URL:** Header and footer, all pages ≥ 640 px
- **Description:** The logo renders `siteConfig.shortName` and, under it, `siteConfig.name` at 10.4 px; both are "PreSeedHealer", so it reads "PreSeedHealer / PreSeedHealer". The 10.4 px text is also below a comfortable reading size.
- **Possible cause:** `Logo.tsx` + `config/site.ts` (`name` === `shortName`). Probably meant to show a tagline or be removed.

### BUG-08: `/api/preview` accepts any `psh_session` cookie value
- **Severity:** Low (security hardening)
- **Page/URL:** `POST /api/preview`
- **Description:** The route only checks that the cookie **exists** (`req.cookies.has`), so `cookie: psh_session=anything` gets a 200 with rendered HTML. The endpoint is stateless and sanitized, so the risk is limited to CPU use (up to 200 KB of Markdown per call).
- **Evidence:** `curl -H 'cookie: psh_session=anything' … → HTTP 200 {"ok":true,"data":{"html":"<h2 …>forged cookie</h2>"…}}`
- **Possible cause:** Presence check instead of verifying the JWT (or proxying the preview through the API, which already verifies sessions).

> **Not bugs (verified):** the 404 pages' console line is Chrome logging the 404 status itself; LinkedIn share URLs return 403 to automated checkers only; the admin page shell rendering with a fake cookie is by design (`proxy.ts` is a fast pre-check, and every data call still returns 401).

### Possible issues / risks (not defects, but worth a decision)

| ID | Area | Observation | Risk |
|---|---|---|---|
| P-01 | Rate limiting | One limiter instance (8 per hour per IP) is shared by all three public forms, and it also counts requests that fail validation or hit the honeypot. Verified: the 9th request of the session across all forms got 429. Visitors behind one IP (office, college, summit Wi-Fi) share the budget. In production, if `TRUST_PROXY` doesn't match the real proxy hop count (the code comment says 2 for Next rewrite + load balancer; the example sets 1), every visitor may appear as the same IP, giving a **site-wide** limit of 8 submissions per hour. | Medium |
| P-02 | Security headers | The web origin sends HSTS, X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy, but **no Content-Security-Policy** (the API has one). | Low |
| P-03 | Admin UX | Visiting `/admin/login` while signed in shows the login form instead of redirecting to the dashboard. | Low |
| P-04 | API design | `PATCH /admin/posts/:id` validates the whole document, so partial updates return 400. The admin UI sends full documents, so it works, but it behaves like a PUT. | Low |
| P-05 | Admin feature gap | Applications and investor leads have CSV export; messages don't. | Low |
| P-06 | UX | If clipboard access is blocked, "Copy link" fails silently (the error is swallowed). | Low |
| P-07 | Content consistency | The Cookie Policy says clearing cookies "will show the consent banner again", but no banner exists until a GA ID is configured. | Low |
| P-08 | Mobile UX | The partner filter chip row has its scrollbar hidden; only the clipped third chip hints that more exist. | Low |

---

## E. Final summary

| Metric | Result |
|---|---|
| Pages/routes tested | **37 HTML routes** (13 static public, 3 articles, 3 categories, 5 listing/search variants, 8 legal, 4 not-found variants, admin login) + **13 admin screens** + 3 machine files + 5 redirects |
| Viewport checks | 148 (37 routes × 4 sizes): **147 PASS, 1 FAIL** |
| Functional tests | **159** |
| Passed | **138** |
| Failed | **6** |
| Partial | **4** |
| Not tested | **11** (messages CSV export + the 10 items in C9) |
| Confirmed bugs | **8** (High 1 · Medium 3 · Low 4) |
| Critical bugs | **0** |
| High-priority bugs | **BUG-01** (session revocation) |
| Server errors (5xx) during audit | **0** |
| JS exceptions / failed API calls on public pages | **0** |

### Overall assessment

**Good: production-quality engineering with a few targeted fixes needed before launch.**

The codebase is unusually solid for its stage:
- Validation is shared between client and server, and was verified both ways.
- Pages render server-side with working on-demand revalidation.
- Accessibility basics are strong: skip link, focus management, ARIA on forms, menus and filters.
- Security is thoughtful: honeypot, rate limits, no account enumeration, sanitized Markdown, SVG blocked, open-redirect guard, admin-only personal data.

Every page loads quickly with no runtime errors, and every navigation element, filter, accordion, search, share control and form behaved as intended.

The main gap is **session revocation (BUG-01)**. The others are a role leak on the dashboard, a mobile table overflow, duplicate investor leads, and polish items. Before go-live, the **content and configuration** listed below matter as much as the bugs: the sample partners, template legal text, and missing contact and grievance details are currently visible to the public.

### Pending configuration and content (not bugs)
1. **Sample partners** ("Sample Angel Network" etc.) are visible on Home, Investors and Partners. Replace them in Admin → Partners.
2. **Legal pages** are starter templates; *Contact & Grievance* contains `[Grievance Officer name]`.
3. **Contact details and social links** are empty in Admin → Settings, so the Contact page shows no email, phone or address.
4. **SMTP** (`SMTP_HOST/USER/PASS`) and **`NOTIFY_EMAILS`** are unset, so no confirmation or team-alert emails are delivered. Applicants currently see "We've emailed a confirmation".
5. **Secrets** (`JWT_SECRET`, `REVALIDATE_SECRET`, `SEED_ADMIN_PASSWORD`) are still the example placeholders. **`NEXT_PUBLIC_SITE_URL`** must be set for production canonical, sitemap and OG URLs.
6. Optional: `NEXT_PUBLIC_GA_ID` (also enables the cookie banner) and `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
7. Local MongoDB: the Homebrew data directory has root-owned files (see setup notes). The audit ran against a temporary MongoDB instance.

---

## Recommended fixes (prioritised for the next development phase)

| Priority | Fix | Addresses |
|---|---|---|
| **P1: before launch** | Make sessions revocable: verify the user and current role in `requireAuth` (or add a token-version claim bumped on logout, password change and role change); consider shorter session lifetimes | BUG-01 |
| P1 | Return submission data on the dashboard only to admins (omit `recentApplications` and submission counts for editors) | BUG-02 |
| P1 | Replace the sample partners, finish the legal pages (grievance officer), fill in contact details, configure SMTP + `NOTIFY_EMAILS`, set real secrets and `NEXT_PUBLIC_SITE_URL` | Pending config |
| P1 | Confirm the production `TRUST_PROXY` hop count, and consider separate per-form limits that don't count failed validations | P-01 |
| **P2: next sprint** | Add `min-w-0` to the grid child that wraps `.article` on legal (and article) pages so tables scroll inside `.table-wrap` | BUG-03 |
| P2 | Add duplicate detection to `POST /investor-interests` (e.g. same email within N days → friendly message), mirroring applications | BUG-04 |
| P2 | Tighten `PhoneSchema` to require a minimum number of digits | BUG-05 |
| P2 | Verify the JWT in `/api/preview` (or proxy it through the API) | BUG-08 |
| P2 | Add a Content-Security-Policy to the Next.js headers (compatible with GA when enabled) | P-02 |
| **P3: polish** | Let the announcement bar wrap on mobile, or provide a short mobile text | BUG-06 |
| P3 | Remove or repurpose the duplicate logo sub-label | BUG-07 |
| P3 | Redirect signed-in users away from `/admin/login`; add messages CSV export; show feedback when clipboard copy fails; align the Cookie Policy text with the banner behaviour; add a scroll affordance on the mobile filter chips | P-03, P-05, P-06, P-07, P-08 |
| P3 | Run a production build + Lighthouse/axe pass, and test on Safari/iOS and Firefox | C9 gaps |

---

## Appendix: test data and artefacts

- **Left in the local (temporary) database for your review, all clearly labelled "QA Test" / `@example.com`:** 1 application (`PSH-26-8MQ5JM`, now status `rejected` with a note), 2 investor leads, 1 contact message.
- **Created and removed again:** QA posts, FAQ, partner, editor account; the site settings announcement text was changed and restored exactly.
- **One uploaded test image:** `apps/api/uploads/2026-11/7896a33db5578fa86f5b68fd.png` (1×1 px; the folder is gitignored).
- **No emails were sent** (SMTP unset, so messages were written to the API console only). No external submissions or payments were made.
- **No source code, configuration, routes or dependencies were changed. Nothing was committed or pushed.**
- Screenshots (every route × 4 viewports, plus menus and success states) and raw JSON results are in the session scratchpad (`…/scratchpad/qa/out/`). That folder is temporary; copy it if you want to keep it.
