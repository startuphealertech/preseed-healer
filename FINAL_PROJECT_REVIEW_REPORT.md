# PreSeedHealer: Final Project Review and Quality Audit

| | |
|---|---|
| **Review date** | 10 Nov 2026 |
| **Branch / base commit** | `fix/qa-audit-8-bugs` @ `9fd12af` (plus the uncommitted BUG-01…08 fixes) |
| **Scope** | Full source review, public site, admin panel, REST API, database, the 8 previously fixed bugs, responsive layout, performance/SEO/accessibility, automated checks |
| **Stack under test** | Next.js 16.4.3 (React 19.3.1), Express 5.3, Mongoose 9, MongoDB 7, Node 23.11 |
| **Browser** | Google Chrome (headless), driven through the DevTools Protocol |
| **Mode** | Inspection and testing only. **No source code, configuration or environment files were modified. Nothing was committed or pushed.** |

> **Status legend:** **PASS** = tested and working · **FAIL** = tested and not working · **PARTIAL** = partly working · **NOT TESTED** = could not verify · **NEEDS REVIEW** = needs a human decision or manual confirmation.
>
> **How data safety was ensured:**
> - Every test that **writes** data ran against a separate API instance (port 4100) backed by a throwaway database, `preseedhealer_review_test`, with uploads going to a temporary folder. The database was dropped at the end.
> - Browser form submissions and admin-panel CRUD on the website were **intercepted in the browser and rerouted** to that isolated API.
> - Checks on the real dev stack (`:3100` → `:4000` → `preseedhealer`) were **read-only**. Admin sessions there were short-lived tokens minted locally, so no login write (`lastLoginAt`) was made.
> - Dev database counts before and after the review are identical: applications 1, investor leads 2, messages 1, users 1, posts 3, pages 8, FAQs 10, partners 8. The uploads folder is unchanged (1 file).

---

## 1. Executive summary

**Overall:** the application is **well engineered and close to launch quality**.
- Security fundamentals are strong: sessions are server-verified and revocable, role checks are enforced in the API, input is validated with shared Zod schemas, Markdown is sanitised, SVG uploads are blocked, CSV formula injection is neutralised, and there is no account enumeration on login.
- All **8 previously reported bugs were re-verified independently and are fixed (8/8 PASS)**.
- The automated checks pass: tests, type check, production builds, and `npm audit` for production dependencies.

The review found **15 new issues**: **2 High, 3 Medium and 10 Low**.

| # | Highest-impact new findings | Priority |
|---|---|---|
| NEW-01 | On phones narrower than ~386 px (320, **360**, 375 px) **every public page scrolls sideways** and the **menu button is pushed partly or fully off-screen**. Cause: the header's "Apply now" button is meant to be hidden on mobile, but a CSS class conflict keeps it visible | **High** |
| NEW-02 | The PM2 deployment file points to a Next.js binary path that doesn't exist in this monorepo, so the web process **would fail to start** when DEPLOY.md is followed | **High** |
| NEW-03 | Nothing stops the API from starting in production with the **public example `JWT_SECRET`**, which would let anyone forge admin sessions. The local `.env` currently uses these example values | Medium |
| NEW-04 | URL fields accept `javascript:` and `data:` URLs (pitch-deck link, websites, partner links, announcement link) | Medium |
| NEW-05 | `og:image` / `twitter:image` are missing on every non-article page, so social shares show no preview image | Medium |

**Launch blockers that are content or configuration, not code:** 8 sample partners shown publicly, all 8 legal pages are starter templates (the Grievance Officer name is a placeholder), contact details and social links are empty, SMTP is not configured, and the secrets are the example placeholders.

**Ready for senior review?** **Yes.** The codebase, tests and this report are in a reviewable state. **Not yet ready for production launch.** Fix NEW-01 and NEW-02 (small, contained changes), address NEW-03 to NEW-05, commit the pending BUG-01…08 fixes, and complete the content and configuration checklist (§13).

---

## 2. Project architecture overview

| Layer | Implementation |
|---|---|
| Monorepo | npm workspaces + Turborepo: `apps/web`, `apps/api`, `packages/types` (shared Zod schemas), `packages/tsconfig` |
| Frontend | Next.js 16 App Router, Tailwind v4, ISR with cache tags; `/api/v1/*` rewritten to the API, so the browser only talks to one origin; `proxy.ts` (middleware) does a fast cookie-presence check for `/admin` |
| Backend | Express 5, routers per module (auth, dashboard, posts, categories, directory: partners/FAQs/pages, media, settings, submissions), helmet, CORS allow-list, compression, a global and per-route rate limiters, central error handler with a consistent `{ok:false,error:{code,message,fields?}}` envelope |
| Auth | HS256 JWT in an HttpOnly, SameSite=Lax cookie `psh_session` (7 days; `Secure` in production). Each protected request checks the user in MongoDB (exists, active, role, `tokenVersion`) and the revoked-session list (`jti`) |
| Roles | `admin` (everything) · `editor` (content only; applications, investor leads, messages, CSV exports and settings saves are admin-only) |
| Database | MongoDB collections: users, revokedsessions (TTL), posts, categories, partners, faqs, pages, settings, applications, investorinterests, contactmessages |
| Integrations | SMTP via nodemailer (logs to the console when unset), on-demand revalidation (API → `POST /api/revalidate` with a shared secret), optional GA4 behind a consent banner |
| Deployment | PM2 `ecosystem.config.cjs`, `deploy/nginx.conf`, `DEPLOY.md`, GitHub Actions CI (`typecheck` + `build`) |

**Routes:**
- **Public:** 13 static pages, 3 articles, 3 categories, search, paginated listing, 8 legal pages, RSS/sitemap/robots, 5 legacy redirects, custom 404.
- **Admin:** 16 screens.
- **API:** about 45 endpoints.

**Pages named in the review brief that do not exist in this project:** *Services*, *Success Stories* and *individual success story* pages. `/services` and `/success-stories` return 404, and there is no route, navigation link or model for them. **NEEDS REVIEW:** confirm whether they are planned.

---

## 3. Total pages reviewed

| Group | Count | Notes |
|---|---|---|
| Public routes crawled | **31** | 13 static pages, 3 articles, 3 categories, 2 search variants, 8 legal pages, the 404 page, `/admin/login` |
| Viewports | **8** | 320, 375, 390, 430, 768, 1024, 1280 and 1440 px |
| Page × viewport checks (production build) | **248** | SEO, images, labels, console, network, contrast, layout |
| Horizontal-overflow checks (corrected method, see §9) | **224** public + **40** admin | |
| Admin screens | **16** | Loaded as admin; key screens also as editor and at 4 widths |
| Machine files and redirects | 3 + 5 | `sitemap.xml` (27 URLs), `robots.txt`, `feed.xml`; legacy redirects return 308 |
| Unique internal links checked | **32** | 0 broken |

---

## 4. Frontend testing results

### 4.1 Page-level results (production build `next start`, all 8 viewports)

| Check | Result | Status |
|---|---|---|
| HTTP status | All 30 content routes 200; unknown URL → custom 404 page with HTTP 404 | PASS |
| Content renders (one `<h1>` per page, body text present) | 31/31 | PASS |
| JS exceptions / console errors | **0** across 248 page loads, 27 interaction tests and the admin session | PASS |
| Failed network requests | **0** (except the intended 404) | PASS |
| Images | No `<img>` on public pages (the logo and icons are inline SVG); 0 broken; uploaded images served correctly (§6) | PASS |
| Internal links | 32 unique, **0 broken** | PASS |
| External links | 9 share links (LinkedIn/X/WhatsApp) correctly built with `noopener`; they use `localhost` until `NEXT_PUBLIC_SITE_URL` is set | PASS |
| Form fields labelled | 0 unlabelled fields | PASS |
| Duplicate IDs | none | PASS |
| Horizontal overflow | **FAIL at 320 and 375 px on all public pages** (NEW-01) · PASS at 390–1440 px | **FAIL** |

### 4.2 Interaction tests (real browser)

| Area | Test | Status |
|---|---|---|
| Navigation | Desktop header: 6 links → correct page with `aria-current="page"` | PASS |
| Navigation | Logo → home; header "Apply now" → `/apply`; announcement bar → `/phase-01` | PASS ×3 |
| Mobile menu (390 px) | Opens (`aria-expanded`, 7 links, body scroll locked, focus moved); Escape closes and returns focus; link click navigates and closes | PASS ×3 |
| Mobile menu (320 px) | Toggle is **off-screen** at the initial scroll position (x = 342–386 in a 320 px viewport) | **FAIL** (NEW-01) |
| Keyboard | First Tab stop is "Skip to content" → `#main`; the next Tab lands inside `<main>` with a 2 px solid focus ring | PASS ×2 |
| FAQ | 10 accordions open (answers visible) and close | PASS |
| Filters | `/investors`: 7 chips, `/partners`: 9 chips. Every chip shows the matching cards and sets `aria-pressed` | PASS ×2 |
| Mobile filter row | Scrolls sideways without page overflow (scrollbar hidden: P-08) | PASS |
| Insights | Search submits and keeps the query; empty-result state; XSS payload in `q` rendered as text; table-of-contents anchors resolve | PASS ×4 |
| Insights | "Copy link" with clipboard permission denied gives **no feedback** (error swallowed) | **FAIL** (P-06, Low) |
| Investor form | Empty submit: 7 errors, focus on the first field, **0 requests**; valid submit: success screen; duplicate email: "You've already registered your interest…" | PASS ×3 |
| Contact form | `?subject=partnership` preselects; invalid optional phone `1-------` blocked in the browser; valid submit: "Message sent" | PASS ×3 |
| Apply wizard | Step 1 empty: errors, no request; cannot jump ahead through the step tabs; all 3 steps → success with reference `PSH-26-XXXXXX` | PASS ×3 |

**Totals:** 27 interaction tests → **25 PASS · 2 FAIL** (NEW-01 at 320 px, P-06).

---

## 5. Admin panel testing results

The admin UI ran in the browser with every `/api/v1` call rerouted to the isolated API.

| Area | Test | Status |
|---|---|---|
| Login | Protected URL → `/admin/login?next=…`; empty submit → "Enter a valid email"; wrong password → "Incorrect email or password"; success returns to the `?next` target | PASS ×4 |
| Login | `?next=https://evil.example` → lands on `/admin` (open redirect blocked) | PASS |
| Login | A signed-in user visiting `/admin/login` is **not redirected** to the dashboard | FAIL (P-03, Low) |
| Logout | Sign out → login page; admin pages protected again; the old token is rejected by the API | PASS ×3 |
| Dashboard | Stat cards equal the database counts (applications, investor leads, messages, published articles); recent applications listed | PASS ×2 |
| Screens | All 16 admin screens load with a heading, no error box, no JS errors | PASS |
| Applications | List, debounced search, status filter chips, detail page (deck link, `mailto:`, `tel:`), status buttons → "Marked as shortlisted" toast, save notes → toast, CSV export link | PASS ×6 |
| Investor leads / Messages | List; unread filter; mark read/unread → toast | PASS ×3 |
| Messages | No CSV export (applications and leads have one) | FAIL (P-05, Low) |
| Content CRUD | FAQ: empty submit blocked in the browser ("Please fix the highlighted fields."); create → edit page; edit → "Saved" toast; two-click delete | PASS ×4 |
| Content CRUD | Article: create draft, cover image upload through the UI, delete | PASS ×3 |
| Markdown preview | Renders sanitised HTML for a valid session; shows "Your session has ended…" for an invalid one | PASS ×2 |
| Settings | Admin saves → toast; editor view is read-only | PASS ×2 |
| Account | Password form: mismatch, too short and wrong current password all report correctly | PASS |
| Editor role | Sidebar hides Applications, Investor leads and Messages; dashboard has no applicant data; a direct URL shows "Admins only" with no data | PASS ×3 |
| Editor role | The "Admins only" box shows a **Retry** button that can never succeed, and the dashboard shows editors an "Update announcement bar" quick link to a page they can't save | NEEDS REVIEW (NEW-11, Low) |
| Mobile admin | Drawer opens with nav links; no overflow at 375/390/768 px on 10 screens | PASS |
| Mobile admin | `/admin/posts` overflows by **27 px at 320 px** | FAIL (NEW-10, Low) |
| Admin form messages | Content forms (FAQs, posts, partners, pages, categories) show raw Zod messages, e.g. "Too small: expected string to have >=5 characters" | FAIL (NEW-08, Low) |
| User and editor management | **No screen exists.** Users, roles and deactivation can only be managed directly in MongoDB | NOT TESTED: feature absent (§13) |

**Totals:** 40 admin UI checks → **35 PASS · 3 FAIL · 1 PARTIAL · 1 NEEDS REVIEW**. The PARTIAL is a stored `javascript:` pitch-deck URL that React neutralises at render (NEW-04).

---

## 6. Backend API testing results

These ran against the isolated API: **101 checks → 92 PASS · 6 FAIL · 1 PARTIAL · 2 NEEDS REVIEW**. Five first-run failures were mistakes in my test script and were re-run correctly; only the verified results are listed.

| Area | Results | Status |
|---|---|---|
| **Authentication** | Malformed login → 400; wrong password and unknown email give an identical 401; NoSQL operator objects in login → 400; email trimmed and case-normalised; cookie `HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` (`Secure` added by code in production); `/auth/me` hides the password hash; login limiter returns 429 on the 11th attempt in 15 minutes | PASS ×8 |
| **Token handling** | Rejected with 401: garbage value, wrong signing secret, expired, legacy token without `jti`, `alg:none`, forged role claim | PASS ×6 |
| **Protected endpoints** | 12 admin GET endpoints and 3 admin write endpoints → 401 anonymously | PASS ×2 |
| **Session lifecycle** | Logout replay → 401 while the user's other device stays signed in; demoted admin → 401; deleted user → 401 for read and write; disabled user → 401; password change: wrong current → 400, too short → 400, success ends other sessions and renews the current cookie; `revokedsessions` TTL index present | PASS ×8 |
| **Role matrix** | Editor: 7 content endpoints 200; 5 personal-data endpoints 403; settings save 403; dashboard keys `posts, partners` only. Admin dashboard includes submissions | PASS ×5 |
| **Role design** | Editors can create, edit, unpublish and **delete legal pages** | NEEDS REVIEW |
| **Posts CRUD** | Draft → 201 and hidden publicly; publish → public 200 with `publishedAt` set; duplicate title → slug `-2`; unknown category → 400; future-scheduled post hidden; deleting an in-use category → 409 `IN_USE`; deleted post → public 404 | PASS ×7 |
| **Partial updates** | `PATCH` with a partial body → 400 (it behaves like `PUT`) | PARTIAL (P-04) |
| **Other content CRUD** | Category create/delete; editor FAQ create/delete; duplicate legal-page slug → 409; invalid settings email → 400 | PASS ×4 |
| **Errors** | Malformed id → 400 `BAD_ID`; unknown id → 404; unknown route → JSON 404; malformed JSON → 400 `BAD_JSON`; body over 1 MB → 413; `page=abc` → 400; regex characters in search → 200; consistent error envelope | PASS ×8 |
| **Media** | PNG → 201 with a random file name; served as `image/png` with `nosniff` and immutable caching; SVG → 400; 6 MB → 400; no file → 400; JSON body → 400; path traversal → 404; dotfiles → 403; editor upload → 201 | PASS ×9 |
| **Media: content check** | HTML content sent with a spoofed `image/png` MIME type is **accepted** (no magic-byte check) | FAIL (NEW-06, Low) |
| **Submissions** | Application → 201 with a valid ref code; duplicate (case-insensitive) → 409; honeypot → fake 201 and nothing saved; missing consent → 400; empty → 400 with 10+ field errors; founded year 1980 → 400; investor duplicate → 409; phone `1-------` → 400; contact → 201 | PASS ×9 |
| **URL validation** | `javascript:` URLs accepted for the application pitch deck, partner website and announcement link; `data:` URL accepted for the pitch deck | FAIL ×4 (NEW-04) |
| **Contact duplicates** | An identical message is accepted again (no dedupe; acceptable for contact) | NEEDS REVIEW |
| **Rate limiting** | One limiter of 8 requests per hour per IP is shared by all 3 forms, and failed validations count towards it (requests 1–8 → 400, 9th → 429) | PARTIAL (P-01) |
| **Lists** | Pagination math; search; regex input escaped; invalid status filter → 400 (not 500); `limit>100` → 400; `page=0` → 400; page past the end → empty; status and notes updates persist; invalid status update → 400; delete → 200 then 404 | PASS ×10 |
| **Injection** | Operator-style query params (`status[$ne]`, `category[$ne]`, `q[$gt]`) are ignored, because Express 5's simple query parser treats them as literal keys. Result totals equal the unfiltered totals | PASS ×2 |
| **Privacy** | Applicant IP not exposed; `emailKey` not exposed; public `/settings` leaks no internal fields | PASS ×3 |
| **CSV** | `text/csv`, attachment, UTF-8 BOM; `=HYPERLINK(...)` and `@SUM(...)` prefixed with `'`; phone numbers left readable | PASS ×3 |
| **CSV: messages** | Messages CSV export endpoint missing | FAIL (P-05) |
| **Headers** | helmet: CSP, HSTS, `nosniff`, `X-Frame-Options`, no `X-Powered-By`; admin responses `Cache-Control: no-store` | PASS ×2 |
| **CORS** | Unknown origin gets no `Access-Control-Allow-Origin`; the allowed origin gets ACAO + credentials | PASS ×2 |

**Live dev stack (read-only):**
- **BUG-08 preview, 401 cases:** no cookie, fake value, expired token, wrong secret, role mismatch, stale token version.
- **BUG-08 preview, valid session:** 200, with `<script>` and `onerror` stripped from the output.
- **Admin API through the web proxy:** posts, applications and dashboard all 200 for a valid admin token; a role-mismatched token → 401.
- **Result: 11/11 PASS.**

**Email notifications:** **NOT TESTED** (no SMTP configured). The code logs to the console in that case; the dev log showed `[mail:dev]` output for test submissions on the isolated instance.

---

## 7. Database review (dev database, read-only)

| Check | Result | Status |
|---|---|---|
| Collections and counts | 11 collections: users 1, posts 3, categories 3, partners 8, FAQs 10, pages 8, settings 1, applications 1, investor leads 2, messages 1, revoked sessions 2 | PASS |
| Indexes | Unique: `users.email`, `posts.slug`, `categories.slug`, `pages.slug`, `applications.refCode`, `settings.key`. Query indexes on status/date. `investorinterests.emailKey_unique` (partial) and `email_1`. `revokedsessions.jti` (unique) and `expiresAt` (TTL) | PASS |
| Referential integrity | 0 posts point to a missing category; deleting an in-use category is blocked (409) | PASS |
| Migration state | 0 users missing `tokenVersion`/`active`; 2 older investor leads without `emailKey` (expected; they sit outside the partial index) | PASS |
| Existing duplicates | 1 duplicate investor-email group (2 QA rows from the original audit), kept on purpose | NEEDS REVIEW (admin may remove) |
| Unused index | The posts text index (`title/excerpt/content/tags`) is never used; search uses a regex, so the index only adds write cost | Low (recommendation) |
| Orphaned uploads | 1 file on disk, 0 referenced. There is no media library or cleanup | Low (recommendation) |
| Production index creation | `autoIndex` is off in production; `npm run seed:prod` must be run to create the new indexes | NEEDS REVIEW (deployment step) |

---

## 8. Verification of the eight previously fixed bugs

I re-read each fix's source and re-tested it independently. **Result: 8/8 PASS.** The fixes are still **uncommitted** in the working tree.

| Bug | What I verified | Evidence | Status |
|---|---|---|---|
| **BUG-01** Session revocation | `requireAuth` loads the user and the revoked-session list on every request; logout revokes the `jti`; role/version/active checks | Isolated: logout replay 401 (other device 200), demoted 401, deleted 401 (read and write), disabled 401, password change ends other sessions, `alg:none`/expired/forged → 401. Dev: role-mismatch and stale-version tokens → 401 | **PASS** |
| **BUG-02** Editor sees applicant data | Dashboard computes submission stats only for the database role `admin`; the UI guards on returned data | Editor dashboard keys `["posts","partners"]`; 5 personal-data endpoints 403; editor UI shows no applicant names; a direct URL shows "Admins only" | **PASS** |
| **BUG-03** Cookie Policy overflow | `min-w-0` on the legal page's `.article` grid item | Table scrolls inside `.table-wrap` at 320–430 px. With the corrected metric, the Cookie Policy overflows by **exactly the same +66/+11 px as every other page** at 320/375 px. That remaining overflow comes from the header (NEW-01), not the table; the original +154 px table overflow is gone | **PASS** (see note) |
| **BUG-04** Duplicate investor leads | Normalised-email check, partial unique index, E11000 → 409 | API: 201 then 409 for a case/space variant; browser shows the friendly message; 6 concurrent submissions → 1 record (repo tests); index present in the dev DB | **PASS** |
| **BUG-05** Phone validation | Shared `PhoneSchema` needs 8–15 digits | `1-------`, `12345`, letters and empty rejected by the API and the browser; `+44 20 7946 0958` and `+91 98765 43210` accepted; contact phone stays optional | **PASS** |
| **BUG-06** Announcement clipped | `truncate` replaced by wrapping | Full text visible at all 8 widths; 2 lines (48 px) at 320–430, 1 line (36 px) at 768+; not clipped | **PASS** |
| **BUG-07** Duplicate logo text | Sub-label removed | Header and footer logos contain "PreSeedHealer" exactly once at all 8 widths | **PASS** |
| **BUG-08** Preview accepts fake cookie | The route verifies the session through the API's `/auth/me` | Dev stack: no cookie, fake, expired, wrong secret, role mismatch and stale version → 401; valid → 200 with sanitised HTML | **PASS** |

> **Correction to `BUG_FIX_IMPLEMENTATION_REPORT.md`:** that report says there is "0 horizontal overflow" at 320/375 px. That reading came from `scrollWidth − innerWidth`, which Chrome's mobile emulation makes misleading: when content overflows, the layout viewport widens to fit it, so `innerWidth` grows too. Measured correctly (`scrollWidth − clientWidth`), every public page overflows at 320/375 px because of **NEW-01**, which already existed on `main`. The BUG-03 conclusion itself still holds.

---

## 9. Responsive testing results

**Method:** each route × viewport was loaded in Chrome with mobile emulation and touch below 768 px. Overflow was measured as `documentElement.scrollWidth − clientWidth` and confirmed visually with screenshots at 320, 390, 768 and 1440 px.

| Viewport | Public pages without overflow | Admin screens without overflow | Notes |
|---|---|---|---|
| 320 px | **1/28 FAIL** (only `/admin/login`, which has no site header) | 9/10 (`/admin/posts` +27 px) | +66 px on every public page; menu toggle off-screen (NEW-01) |
| 375 px | **1/28 FAIL** | 10/10 | +11 px on every public page (NEW-01) |
| 390 px | 28/28 PASS | 10/10 | |
| 430 px | 28/28 PASS | n/a | |
| 768 px | 28/28 PASS | 10/10 | |
| 1024 px | 28/28 PASS | n/a | |
| 1280 px | 28/28 PASS | n/a | |
| 1440 px | 28/28 PASS | n/a | |

| Component | Result |
|---|---|
| Navbar / mobile menu | PASS at ≥ 390 px · **FAIL below ~386 px** (NEW-01) |
| Containers, cards, grids | PASS (screenshots: no overlap or clipping at 320/390/768/1440) |
| Tables | PASS (scroll inside their wrapper) |
| Forms, buttons | PASS (full width on mobile, labels visible, 16 px inputs prevent iOS zoom) |
| Footer | PASS |
| Text wrapping | PASS (announcement wraps; long headings wrap) |
| Filter chip rows | PASS (scroll sideways; hidden scrollbar is P-08) |

---

## 10. Performance, SEO and accessibility findings

### Performance (production build, local)
| Metric | Result | Status |
|---|---|---|
| TTFB | 3–19 ms | PASS |
| Load event | 18–61 ms | PASS |
| LCP (local) | 28–72 ms | PASS |
| CLS | 0 on public pages (0.017 on `/admin/login`) | PASS |
| Compressed transfer, cold cache (390 px) | JS **183–202 KB**, CSS 14 KB, fonts 73 KB (157 KB on articles), total 278–417 KB | PASS: typical React 19/Next baseline; could be trimmed for mostly static pages |
| Server-only libraries | `marked` and `sanitize-html` are not in client bundles | PASS |
| Images | No raster images on public pages yet; `next/image` set up with AVIF/WebP for uploads | PASS |
| Caching | ISR with `s-maxage=300` and tag-based on-demand revalidation | PASS |
| Load timings on real networks and devices | Not measured; local numbers aren't representative | NOT TESTED |

### SEO
| Check | Result | Status |
|---|---|---|
| Titles | Unique on every indexable page (search variants share one title but are `noindex`) | PASS |
| Meta descriptions | Present everywhere; **legal (49–73 chars) and category (53–71 chars) descriptions are short or generic** | PARTIAL (NEW-12) |
| Canonical | Correct on all 29 indexable routes; none on 404 and login | PASS |
| Open Graph / Twitter | Title, description, URL and type present; **`og:image` and `twitter:image` missing on all non-article pages** | **FAIL** (NEW-05) |
| Structured data | Organization + WebSite everywhere; BreadcrumbList; Article and FAQPage on articles; FAQPage on `/faq`; Event on `/summit-2026`; all JSON-LD parses | PASS |
| Sitemap | 27 URLs, matches the public routes | PASS |
| Robots | Disallows `/admin` and `/api/`; `Host:` line contains a scheme (non-standard); `/api/` also blocks crawlers from uploaded images | PARTIAL (NEW-12) |
| `lang` | `en-IN` | PASS |
| Titles | "PreSeedHealer Summit 2026 \| PreSeedHealer" repeats the brand | Low (NEW-12) |

### Accessibility
| Check | Result | Status |
|---|---|---|
| Semantic HTML | Landmarks, one `<h1>`, `nav` labels, breadcrumbs | PASS |
| Heading order | `h1 → h3` skip on `/insights`, category and search listings | FAIL (NEW-13, Low) |
| Alt text | No `<img>` without `alt` | PASS |
| Keyboard | Skip link works; visible 2 px focus ring; menu Escape and focus return; accordions are native `<details>` | PASS |
| Form labels and errors | All fields labelled; errors linked with `aria-describedby`/`aria-invalid`, `role=alert`; focus moves to the first error | PASS |
| Accessible names | 0 nameless buttons or links. TOC links inside the collapsed mobile `<details>` were flagged but are hidden (false positive) | PASS |
| Colour contrast | Below AA: FeatureCard numbers "01–06" and About labels (`ink-300`, **1.84:1**), "(optional)" hints and "Phase 02" (`ink-400`, **2.7–2.9:1**), breadcrumbs and article meta (4.36:1), "Coming soon" badge (4.39:1) | FAIL (NEW-09, Low) |
| Small text | "Soon" footer badge at 10.4 px | Low (NEW-13) |
| Touch targets (< 24 px) | Breadcrumb links, category badge links, consent-label links on mobile | Low (NEW-13) |
| Screen reader testing | Needs manual testing with VoiceOver or NVDA | NOT TESTED |

---

## 11. New bugs discovered

### NEW-01: Mobile header overflows below ~386 px and hides the menu button
- **Priority:** **High**
- **Affected:** every public page (header) at viewports up to ~385 px: 320, **360** (the most common Android width in India) and 375 px (iPhone SE, mini, 8)
- **Description:**
  - The header's "Apply now" button is meant to be hidden below the `sm` breakpoint (`className="hidden sm:inline-flex"` in `Header.tsx:20`). On mobile, the drawer has its own "Apply now".
  - `Button` builds its classes with `cn()`, which is plain `clsx` with no tailwind-merge. The element therefore gets both the component's base `inline-flex` and the caller's `hidden`.
  - In the compiled CSS, `.inline-flex` is declared after `.hidden` (same specificity), so it wins and the button is always shown.
  - Logo + "Apply now" + menu toggle need 386 px. On narrower screens the page scrolls sideways and the toggle sits at x = 342–386: completely off-screen at 320 px, partly cut off at 360/375 px.
- **Already existed on `main`:** `Header.tsx`, `Button.tsx`, `MobileNav.tsx` and `cn.ts` are unchanged from `main`. The original audit only tested 390 px, where everything fits.
- **Steps:**
  1. Open any page at a 320 px width (DevTools device mode, or an iPhone SE 1st gen).
  2. Look at the header.
  3. Swipe left.
- **Expected:** logo and menu button fit; no horizontal scroll.
- **Actual:**
  - `scrollWidth` is 386 while `clientWidth` is 320 (+66 px); +11 px at 375 px.
  - The menu button is not visible until you scroll sideways.
  - The header's "Apply now" is visible at every width (computed `display: flex` at 390 px).
- **Recommended solution:** either
  - make `cn()` conflict-aware with `tailwind-merge`, which fixes this class of bug project-wide, or
  - stop putting the display utility on `Button` (e.g. wrap it in `<span className="hidden sm:block">`).

  Then re-run the overflow sweep at 320/360/375 px.

### NEW-02: PM2 config points to a non-existent Next.js binary
- **Priority:** **High** (deployment blocker)
- **Affected:** `ecosystem.config.cjs` (`preseedhealer-web`), DEPLOY.md §3
- **Description:**
  - The web process runs `script: "node_modules/next/dist/bin/next"` with `cwd: "./apps/web"`.
  - With npm workspaces, `next` is hoisted to the root `node_modules`. `apps/web/node_modules/next/dist/bin/next` **does not exist**; `node_modules/next/dist/bin/next` does.
- **Steps:**
  1. `npm ci`
  2. `ls apps/web/node_modules/next/dist/bin/next` → *No such file*
  3. `pm2 start ecosystem.config.cjs --only preseedhealer-web`
- **Expected:** the web app starts on port 3100.
- **Actual:** PM2 can't find the script. Verified by file presence; PM2 itself was not run.
- **Recommended solution:** use `script: "npm", args: "run start"` (`cwd: ./apps/web`), or `script: "../../node_modules/next/dist/bin/next"`. Add a smoke test of the PM2 config to the deploy checklist.

### NEW-03: No guard against placeholder secrets in production
- **Priority:** Medium (High if deployed as is)
- **Affected:** `apps/api/src/config/env.ts`, `apps/api/.env`
- **Description:**
  - The local `.env` uses the exact `JWT_SECRET`, `REVALIDATE_SECRET` and `SEED_ADMIN_PASSWORD` values from the committed `.env.example`. I compared them without printing the values.
  - `env.ts` only checks minimum length. If production starts with the example `JWT_SECRET`, anyone who has read the repo can sign a valid admin session cookie.
- **Steps:** set `NODE_ENV=production` with the example values → the server starts normally.
- **Expected:** startup is refused in production when a secret equals a known placeholder.
- **Actual:** it starts.
- **Recommended solution:**
  - In `env.ts`, reject values that contain `change-me` (or that equal the example values) when `NODE_ENV=production`.
  - Rotate the secrets before going live.
  - Change the seeded admin password after the first login (already in the DEPLOY checklist).

### NEW-04: URL fields accept `javascript:` and `data:` URLs
- **Priority:** Medium (security hardening)
- **Affected:**
  - public application fields `pitchDeckUrl`, `website`, `linkedin`
  - investor `linkedin`
  - admin partner `website`
  - settings `announcement.href` (and the social links that use the same URL schema)
- **Description:**
  - `z.url()` / `OptionalUrlSchema` accept any scheme.
  - Stored values are rendered as `<a href>` in the admin (the pitch-deck link) and on the public site (partner website, announcement), and also appear raw in CSV exports and team emails.
  - **React 19 neutralises `javascript:` hrefs** at render. Verified: it outputs `javascript:throw new Error('React has blocked…')`. That prevents XSS in the UI.
  - `data:` URLs are **not** neutralised, and email or CSV consumers get no such protection.
- **Steps:** `POST /api/v1/applications` with `pitchDeckUrl: "javascript:alert(document.cookie)"` → 201; the same with `data:text/html,…` → 201.
- **Expected:** 400 "Enter a valid URL (https://…)".
- **Actual:** 201, stored.
- **Recommended solution:** restrict the shared URL schemas to `http`/`https`, e.g. `z.url({ protocol: /^https?$/ })`, in `common.ts`, `forms.ts`, `content.ts` and `settings.ts`. Allow site-relative paths where needed, such as the announcement link.

### NEW-05: `og:image` / `twitter:image` missing on non-article pages
- **Priority:** Medium (SEO / social sharing)
- **Affected:** home, about, startups, investors, summit, phases, apply, FAQ, contact, partners, insights, categories and legal pages (28 of 31 routes)
- **Description:**
  - `buildMetadata()` (`lib/seo.ts`) always returns an `openGraph` and a `twitter` object without `images` unless an image is passed.
  - Next.js replaces the parent's `openGraph` rather than merging it, so the root `app/opengraph-image.tsx` is dropped. The code comment says the opposite.
- **Steps:** `curl -s http://localhost:3100/about | grep og:image` → nothing.
- **Expected:** `<meta property="og:image" …>` and `twitter:image` on every page.
- **Actual:** missing. Present only on the 3 articles (which have their own route image) and on 404/login.
- **Recommended solution:** in `buildMetadata()`, default `images` to the site OG image URL (`absoluteUrl("/opengraph-image")`), or add `opengraph-image` files per segment. Check with a social-card validator.

### NEW-06: Upload type is trusted from the client-declared MIME type
- **Priority:** Low
- **Affected:** `POST /api/v1/admin/media`
- **Description:** `fileFilter` checks `file.mimetype`, which comes from the client. A text/HTML payload declared as `image/png` is stored as `.png`. It is served as `image/png` with `nosniff`, so it is not executable; the risk is junk or misleading files.
- **Steps:** upload `<html>…</html>` as `evil.png` with `type=image/png` → 201.
- **Expected:** 400 for content that isn't an image.
- **Recommended solution:** check magic bytes (e.g. `file-type`) or decode with `sharp` and re-encode; also consider stripping EXIF.

### NEW-07: Admin article list only loads the first 100 posts
- **Priority:** Low (becomes Medium as content grows)
- **Affected:** `/admin/posts` (`ResourceList.tsx:13`)
- **Description:** the list fetches `?limit=100` and searches only on the client. Posts beyond the 100 most recently updated can't be found or reached from the admin.
- **Expected:** server-side pagination and search (the API already supports `page` and `q`).
- **Recommended solution:** reuse the paginated table pattern from `submissions.tsx` (debounced `q`, Prev/Next).

### NEW-08: Admin content forms show raw validation messages
- **Priority:** Low (UX)
- **Affected:** FAQ, post, partner, page and category forms
- **Description:** the schemas in `content.ts` have no custom messages, so admins see "Too small: expected string to have >=5 characters" or "Invalid option: expected one of …".
- **Recommended solution:** add friendly messages, as the public form schemas already do.

### NEW-09: Text below WCAG AA contrast
- **Priority:** Low (accessibility)
- **Affected:** FeatureCard index numbers (home, startups), About "Purpose/Approach/Focus/Vision" labels, "(optional)" field hints, Summit "Phase 01/02" labels, breadcrumbs and article meta on light hero backgrounds, the "Coming soon" badge
- **Measured:**
  - `#b9bfd1` on white: **1.84:1**
  - `#8f97b0` on white: **2.91:1**
  - `#6b7491` on `#f7f8fb`: **4.36:1**
- **Expected:** ≥ 4.5:1 for normal text (≥ 3:1 for large text).
- **Recommended solution:** use `ink-500`/`ink-600` for these elements, and treat purely decorative numerals as `aria-hidden`.

### NEW-10: `/admin/posts` overflows by 27 px at 320 px
- **Priority:** Low
- **Affected:** admin article list on very small phones
- **Recommended solution:** let the header actions wrap, or let the table scroll inside its container; re-check at 320 px.

### NEW-11: Editor UI dead ends
- **Priority:** Low (UX) · NEEDS REVIEW
- **Description:**
  - When an editor opens an admin-only URL, the error box offers **Retry**, which can never succeed.
  - The editor dashboard shows the quick link "Update announcement bar & phases" to a settings page editors can't save.
- **Recommended solution:** hide the Retry button on 403 and show "This section is for admins", and hide admin-only quick links for editors.

### NEW-12: SEO polish
- **Priority:** Low
- **Description:**
  - Legal and category meta descriptions are short and generic (49–73 chars).
  - `robots.txt` has `Host: http://localhost:3100`. `Host` is non-standard and should have no scheme; it can be removed.
  - The Summit title repeats the brand.
  - `Disallow: /api/` also blocks crawlers (including Twitterbot) from images uploaded under `/api/v1/uploads/`.
- **Recommended solution:** write per-page descriptions in the CMS; remove `Host`; set `title: { absolute: … }` for the Summit page; allow `/api/v1/uploads/` in robots.

### NEW-13: Accessibility polish
- **Priority:** Low
- **Description:** heading level skip (`h1 → h3`) on the insights listing pages; "Soon" badge at 10.4 px; breadcrumb, category-badge and consent links are smaller than 24 px tap targets on mobile.
- **Recommended solution:** use `h2` for card titles (or add a visually hidden `h2` section heading); make the badge at least 12 px; add vertical padding to the small links.

### NEW-14: Quality tooling gaps
- **Priority:** Low
- **Description:**
  - CI (`.github/workflows/ci.yml`) runs only `typecheck` and `build`. The 47 API tests are **not** run in CI (they need a MongoDB service).
  - No lint configuration (ESLint/Prettier/Biome) exists.
  - The web app has no automated tests.
  - `npm audit` (including dev dependencies) reports 3 dev/build-time advisories: esbuild (Windows dev-server file read, low), and postcss-selector-parser via `@tailwindcss/typography` (moderate, build-time CPU).
- **Recommended solution:**
  - Add a `mongo:7` service and `npm test` to CI.
  - Add ESLint with the Next config.
  - Add a small Playwright smoke suite (including a 320 px overflow assertion that would have caught NEW-01).
  - Track the advisories for upstream fixes.

### NEW-15: Documentation inconsistency on `TRUST_PROXY`
- **Priority:** Low · NEEDS REVIEW
- **Description:**
  - The `env.ts` comment gives "Next.js rewrite + platform LB = 2" as the example, while `.env.example` and DEPLOY.md say `1` (with Nginx overwriting `X-Forwarded-For`).
  - A wrong value makes every visitor share one rate-limit bucket, or lets clients spoof their IP (P-01).
- **Recommended solution:** confirm the real hop count in the target hosting and align the comment, example and docs.

### Previously reported "possible issues" (P-01…P-08): current status
| ID | Item | Status |
|---|---|---|
| P-01 | One 8/hour limiter shared by all forms; failed validations counted | PARTIAL (still as designed; confirmed) |
| P-02 | No Content-Security-Policy on the web origin | FAIL (still missing; the API has one) |
| P-03 | Signed-in user not redirected away from `/admin/login` | FAIL |
| P-04 | `PATCH` requires the full document | PARTIAL |
| P-05 | No messages CSV export | FAIL |
| P-06 | "Copy link" fails silently when clipboard access is blocked | FAIL (confirmed in this run) |
| P-07 | Cookie Policy mentions a consent banner that only exists when GA is configured | NEEDS REVIEW (content) |
| P-08 | Mobile filter-chip scrollbar hidden (`scrollbar-width: none`) | NEEDS REVIEW (UX) |

---

## 12. Security concerns

| Area | Assessment |
|---|---|
| Sessions | **Strong.** Server-verified on every request, revocable on logout, invalidated on deletion, demotion, deactivation and password change; `alg` pinned to HS256 |
| Authorization | **Strong.** Role taken from the database; personal data admin-only at router level; verified with a role matrix |
| Input validation | **Strong**, with one gap: shared Zod schemas on client and server reject operator injection, but URL schemes are not restricted (**NEW-04**) |
| XSS | Markdown sanitised (allow-listed tags and schemes); search escaped; React 19 blocks `javascript:` hrefs; SVG uploads blocked |
| CSRF | SameSite=Lax cookie + JSON-only body parsing; no state-changing GET routes |
| Secrets | **Risk:** placeholder secrets with no production guard (**NEW-03**); `.env` files are gitignored and not in git history |
| Headers | API: helmet with CSP. Web: HSTS, `nosniff`, `X-Frame-Options`, Referrer-Policy and Permissions-Policy, but **no CSP** (P-02) |
| Uploads | Size and type limits, random names, `nosniff`, no SVG; MIME not content-checked (**NEW-06**) |
| Rate limiting | Login 10/15 min; forms 8/hour shared (P-01); global 600/15 min for writes and admin. No limiter specifically on `/auth/password` (it needs a session) |
| Information exposure | No password hash, applicant IP or internal settings fields in responses. Duplicate-submission 409s reveal that an email has already applied or registered (accepted trade-off) |
| Dependencies | 0 production vulnerabilities; 3 dev/build-time advisories (NEW-14) |
| API exposure | DEPLOY.md correctly says to keep the API private. With `TRUST_PROXY=1`, a publicly reachable API would let clients spoof `X-Forwarded-For` |

---

## 13. Incomplete features or placeholder content

| Item | Where | Status |
|---|---|---|
| **8 sample partners** ("Sample Angel Network", …) shown publicly | Home, Investors, Partners | Placeholder content |
| **All 8 legal pages are starter templates**; Contact & Grievance has `[Grievance Officer name]` | `/legal/*` | Placeholder content (legal review needed) |
| Contact email, phone, address and all social links empty | Settings → Contact page and footer | Configuration missing |
| SMTP and `NOTIFY_EMAILS` not configured; applicants are told "We've emailed a confirmation" | API env | Configuration missing |
| Secrets equal the example placeholders; `NEXT_PUBLIC_SITE_URL` is localhost (canonical, sitemap, share URLs) | Env | Configuration missing (NEW-03) |
| Cookie banner and GA only appear when `NEXT_PUBLIC_GA_ID` is set | Web env | Optional |
| Summit date and venue "to be announced" | `/summit-2026` | Content pending |
| **No user or editor management UI** (create, invite, change role, deactivate, reset password) | Admin | Feature absent; MongoDB access needed today |
| No media library (list, delete or reuse uploads) | Admin | Feature absent |
| Messages CSV export | Admin | Missing (P-05) |
| Services and Success Stories pages | Named in the review brief | Not present in the project (NEEDS REVIEW) |

---

## 14. Test execution summary

| Suite | Executed | Result |
|---|---|---|
| Backend tests: `npm test -w @preseedhealer/api` (node:test + tsx, throwaway database) | Yes | **47/47 PASS** |
| Frontend tests | n/a | **NOT TESTED**: no frontend test infrastructure exists |
| TypeScript: `npm run typecheck` | Yes | **PASS** (3/3 packages, 0 errors) |
| Production build: `npm run build` | Yes | **PASS** (API tsup + Next build, 45 static pages) |
| Lint | n/a | **NOT TESTED**: no lint configuration or script exists |
| Dependency audit: `npm audit --omit=dev` / `npm audit` | Yes | **0** production vulnerabilities / 3 dev advisories (1 low, 2 moderate) |
| API security and behaviour suite (isolated API) | Yes | **101 checks: 92 PASS · 6 FAIL · 1 PARTIAL · 2 NEEDS REVIEW** |
| Dev stack read-only checks (BUG-08, admin proxy, role mismatch) | Yes | **11/11 PASS** |
| Public browser crawl (31 routes × 8 viewports, production build) | Yes | 248 loads: 0 JS errors, 0 failed requests, 0 broken links or images |
| Overflow sweep (corrected metric) | Yes | Public **170/224 PASS** (54 FAIL = all pages at 320/375 px, NEW-01) · Admin **39/40 PASS** |
| Public interaction tests | Yes | **27: 25 PASS · 2 FAIL** |
| Admin UI tests (rerouted to isolated API) | Yes | **40: 35 PASS · 3 FAIL · 1 PARTIAL · 1 NEEDS REVIEW** |
| Database review (read-only) | Yes | Structure PASS; content placeholders noted |
| Email delivery | No | **NOT TESTED**: SMTP not configured |
| Real devices, Safari, Firefox | No | **NOT TESTED**: only headless Chromium available |
| Screen readers, Lighthouse/axe | No | **NOT TESTED**: tools not installed (no new packages, per the rules) |
| Load and stress testing | No | **NOT TESTED**: out of scope for a local review |
| PM2 / Nginx deployment run | No | **NOT TESTED**: config inspected statically (found NEW-02) |

**Environment notes:**
- A temporary second API (port 4100) and a production web server (`next start`, port 3200) were started for testing and stopped afterwards.
- The throwaway database `preseedhealer_review_test` was dropped.
- Test artefacts (scripts, screenshots, JSON results) are in the session scratchpad, not in the repository.

---

## 15. Remaining issues (prioritised)

| Priority | Issues |
|---|---|
| **Critical** | None |
| **High** | NEW-01 mobile header overflow and hidden menu below 386 px · NEW-02 PM2 web start path |
| **Medium** | NEW-03 placeholder-secret guard · NEW-04 URL scheme allow-list · NEW-05 missing `og:image` · P-02 web CSP · launch content and config (§13) |
| **Low** | NEW-06 … NEW-15 · P-01, P-03, P-04, P-05, P-06 · P-07/P-08 (needs review) |
| **Process** | The BUG-01…08 fixes and the new test suite are **uncommitted** on `fix/qa-audit-8-bugs`; run `npm run seed:prod` after deploying to create the new indexes |

---

## 16. Recommended improvements (in order)

1. **Fix NEW-01**, ideally by adding `tailwind-merge` to `cn()`, and add an automated 320/360/375 px overflow check.
2. **Fix NEW-02**, then dry-run `pm2 start ecosystem.config.cjs` on a staging box.
3. **Fix NEW-03 / NEW-04:** a production secret guard, and `https`-only URL schemas.
4. **Fix NEW-05** (default OG image) and add a CSP to the Next.js headers (P-02), keeping it compatible with GA.
5. **Commit the BUG-01…08 work** after senior review. Add the API tests to CI with a MongoDB service, and add ESLint.
6. **Before launch:** replace sample partners, finalise legal pages (Grievance Officer), fill contact and social settings, configure SMTP + `NOTIFY_EMAILS`, rotate all secrets, set `NEXT_PUBLIC_SITE_URL`, run `seed:prod`.
7. **Next sprint:**
   - admin user management (invite, role, deactivate)
   - server-side pagination for admin posts (NEW-07)
   - friendly admin validation messages (NEW-08)
   - contrast fixes (NEW-09)
   - P-03/P-05/P-06
   - per-form rate limits that don't count failed validations (P-01)
   - upload magic-byte checks (NEW-06)
8. **Quality:** Playwright smoke tests, a Lighthouse/axe pass, Safari/iOS and Firefox checks, and a real-device check of the mobile menu.

---

## 17. Git branch and working tree status

- **Branch:** `fix/qa-audit-8-bugs`. HEAD is `9fd12af` (the only commit). `main` was not touched. No branch switch, commit, push, merge or rebase was done.
- **Working tree:** 17 modified tracked files (the BUG-01…08 fixes from the previous task, uncommitted). Untracked files: `WEBSITE_QA_AUDIT_REPORT.md`, `BUG_FIX_IMPLEMENTATION_REPORT.md`, `apps/web/AGENTS.md`, `apps/api/src/tests/`, and this report.
- **This review changed nothing** in source, configuration, environment files, the dev database or the uploads. The only new file is `FINAL_PROJECT_REVIEW_REPORT.md`.
