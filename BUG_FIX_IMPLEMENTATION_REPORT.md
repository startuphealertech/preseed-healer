# Bug Fix Implementation Report: PreSeedHealer QA Audit

| | |
|---|---|
| **Date** | 10 Nov 2026 |
| **Branch** | `fix/qa-audit-8-bugs` (base `9fd12af`) |
| **Source** | `WEBSITE_QA_AUDIT_REPORT.md` (BUG-01 … BUG-08) |
| **Environment** | Node 23.11, MongoDB on `127.0.0.1:27017`, API dev server on `:4000`, web dev server on `:3100`, headless Google Chrome |
| **Commits / pushes** | None. All changes are uncommitted in the working tree |

## 1. Summary

All 8 reported bugs are fixed and verified, using four methods:
- **Automated tests:** 47 new tests, all passing.
- **Live requests:** against the running dev servers, sent through the same `/api/v1` proxy the browser uses.
- **Browser checks:** scripted headless-Chrome runs at 6 viewports.
- **Builds and type checks:** `npm run typecheck` and `npm run build` both succeed.

I also found and fixed 4 closely related defects (§9).

The fixes keep the existing architecture: the same JWT-in-HttpOnly-cookie auth, the same Express routers, the shared Zod schemas and the same UI components. No new dependencies were added. No existing database records were changed or deleted.

| Bug | Priority | Status |
|---|---|---|
| BUG-01 Session stays valid after logout / deletion / demotion | High | **Fixed and verified** |
| BUG-02 Editor receives applicant data | Medium | **Fixed and verified** |
| BUG-03 Cookie Policy horizontal overflow on mobile | Medium | **Fixed and verified** |
| BUG-04 Duplicate investor submissions | Medium | **Fixed and verified** |
| BUG-05 Phone validation accepts `1-------` | Low | **Fixed and verified** |
| BUG-06 Announcement text clipped on mobile | Low | **Fixed and verified** |
| BUG-07 Duplicate brand name in logo | Low | **Fixed and verified** |
| BUG-08 Markdown preview checks only cookie presence | Low | **Fixed and verified** |

---

## 2–5. Per-bug details

### BUG-01: Admin session remains active after logout, deletion or role change

**Problem.** A JWT stayed valid for its full 7 days after logout, after the user was deleted, or after the user was demoted.

**Root cause.** `requireAuth` (`apps/api/src/middleware/auth.ts`) trusted the token's `sub` and `role` claims and never checked the database. Logout only cleared the browser cookie.

**Solution.** The JWT-in-cookie design is unchanged; it is now backed by server-side checks:
- **New claims.** Tokens now carry a session id (`jti`, a random UUID) and a token version (`tv`).
- **Database check on every request.** `requireAuth` loads the user from MongoDB on every protected request. It rejects the request with 401 if:
  - the account no longer exists or is disabled (`active: false`), or
  - the role in the database differs from the role the token was issued with (so a demoted admin's old session dies, even when the role was edited directly in MongoDB), or
  - the user's `tokenVersion` has changed since sign-in, or
  - the token's `jti` was revoked by logout.
- **Logout.** `POST /auth/logout` writes the session's `jti` to a new `revokedsessions` collection, then clears the cookie. The collection has a TTL index, so each row expires when the token it revokes would have expired. Logout ends only that session; the user's other devices stay signed in.
- **Role changes.** Changing a role through Mongoose (`save`, `updateOne`, `findOneAndUpdate`) bumps `tokenVersion` automatically.
- **Password changes.** Changing the password bumps `tokenVersion`, which signs out all other sessions. The current browser gets a fresh cookie.
- **Login.** Disabled accounts get the same generic "Incorrect email or password" response, so the response doesn't reveal which accounts exist.
- **Dead cookies.** When `requireAuth` rejects a cookie, it also clears it. The web middleware (`proxy.ts`) then sends the browser to the login page.
- **Old-format tokens.** Tokens issued before this change have no `jti`/`tv` and are rejected. Every admin will need to sign in once after deployment.

**Files:** `apps/api/src/middleware/auth.ts`, `apps/api/src/modules/auth/auth.routes.ts`, `apps/api/src/modules/auth/user.model.ts`, `apps/api/src/scripts/seed.ts` (index sync for the new collection)

### BUG-02: Editor can access applicant information

**Problem.** `GET /admin/dashboard` returned `recentApplications` (founder name, startup name, sector, status, ref code) and submission counts to any signed-in user, including editors.

**Root cause.** The dashboard router was mounted behind `requireAuth` only and had no role check. The other submission routers are guarded by `requireAdmin`.

**Solution.**
- **Backend.** Submission statistics are now computed and returned **only when the database role is `admin`**. Editors get only `posts` and `partners`. The admin-only submission endpoints (`/admin/applications`, `/admin/investor-interests`, `/admin/messages`, CSV exports) already returned 403 to editors and still do. Because the role now comes from the database (BUG-01), a forged or stale role claim can't get around these checks.
- **Frontend.** `DashboardStats` now marks the submission fields as optional. `Dashboard.tsx` renders the submission widgets only when the user is an admin **and** the API actually returned the data.

**Files:** `apps/api/src/modules/dashboard/dashboard.routes.ts`, `packages/types/src/forms.ts`, `apps/web/src/admin/Dashboard.tsx`

### BUG-03: Cookie Policy horizontal overflow on mobile

**Problem.** At 390 px the page was 544 px wide.

**Root cause.** On legal pages the `.article` element is a direct grid item (`grid lg:grid-cols-[1fr_15rem]`). Grid items default to `min-width: auto`, so the track grew to fit the table's `min-w-[32rem]`, and the `.table-wrap` (`overflow-x: auto`) could never become narrower than the table. The insights article page already avoids this by wrapping `.article` in a `min-w-0` element; the legal page did not.

**Solution.** Added `min-w-0` to the legal page's `.article` grid item. Tables now scroll inside `.table-wrap`; the desktop layout is unchanged. I checked all 8 legal pages and the article template. The only other `.article` usage (the admin preview) is not a grid item.

**Files:** `apps/web/src/app/(site)/legal/[slug]/page.tsx`

### BUG-04: Duplicate investor submissions

**Problem.** The same email could create any number of investor-lead records.

**Root cause.** `POST /investor-interests` had no duplicate check. The applications endpoint does have one.

**Solution.**
- **Normalisation.** Emails are trimmed and lower-cased before validation (see §9, related fix 1) and again explicitly with `normalizeEmail()` before the duplicate check.
- **Duplicate check.** The route checks for an existing lead with that email. This covers all existing records, including ones created before this fix. A duplicate gets **409 `DUPLICATE`** with the message: *"You've already registered your interest with this email. Our team will be in touch."* The existing form error handling shows this message in the form alert, the same way as the application form's duplicate message.
- **Concurrency.** New leads also store `emailKey`, which has a **partial unique index** (`emailKey_unique`, filter `emailKey: {$type: "string"}`). If two identical submissions race past the check, the second insert fails with E11000, which is turned into the same 409.
- **Why a partial index.** I inspected the local data first (read-only). It already has **2 duplicate QA rows** for one email, so a plain unique index on `email` would fail to build. Older rows have no `emailKey`, so they are outside the index. **No existing records were changed or deleted.**
- **Indexes.** Added a plain index on `email` for the lookup. `emailKey` is `select: false`, so it never appears in admin API responses or CSV exports.

**Files:** `apps/api/src/modules/submissions/submissions.models.ts`, `apps/api/src/modules/submissions/submissions.routes.ts`

### BUG-05: Phone validation accepts invalid values

**Problem.** `1-------` was accepted.

**Root cause.** The shared `PhoneSchema` regex `^\+?[0-9][0-9 ()-]{7,18}$` counted separators toward the length, so a single digit was enough.

**Solution.** `PhoneSchema` (in `packages/types`, used by the client forms **and** the API) now:
- allows an optional leading `+`, digits, spaces, `-`, `.`, `(` and `)`, up to 25 characters, and
- requires **8–15 actual digits** (15 is the E.164 maximum).

It accepts numbers such as `+91 98765 43210`, `+1 (555) 123-4567`, `+44 20 7946 0958` and `020.7946.0958`. It rejects `1-------`, `12345`, letters, separator-only input, a second `+`, and more than 15 digits. The contact form's phone field is still optional (an empty value is allowed) but is validated when filled in.

**Files:** `packages/types/src/common.ts`

### BUG-06: Announcement bar text clipped on mobile

**Problem.** "Phase 01 applications open · Open until further notice" was cut off with an ellipsis on phones.

**Root cause.** The text `<span>` used `truncate` (single line, `overflow: hidden`, ellipsis). The bar itself has `min-h-9` (a minimum, not a fixed height), so the bar was not the problem.

**Solution.** Replaced `truncate` with `min-w-0 text-balance break-words`. The text wraps onto two balanced lines on narrow screens (bar 48 px tall at 320–390 px) and stays on one line from 768 px up (36 px, same as before).

**Files:** `apps/web/src/components/layout/AnnouncementBar.tsx`

### BUG-07: Duplicate brand name in logo

**Problem.** The logo read "PreSeedHealer / PreSeedHealer", and the second line was a tiny 10.4 px label.

**Root cause.** `Logo.tsx` rendered `siteConfig.shortName` with `siteConfig.name` underneath it at ≥ 640 px, and both are "PreSeedHealer".

**Solution.** Removed only the duplicate sub-label. The icon, wordmark styling, `aria-label`, tones (header/footer) and responsive layout are unchanged. `siteConfig` was left alone because `name` is used elsewhere (metadata, JSON-LD, manifest).

**Files:** `apps/web/src/components/ui/Logo.tsx`

### BUG-08: Markdown preview endpoint does not validate authentication

**Problem.** `POST /api/preview` accepted any `psh_session` value.

**Root cause.** The Next.js route only checked `req.cookies.has("psh_session")`.

**Solution.**
- **Real session check.** The route now asks the API (`GET /auth/me`, server-to-server, `no-store`) to resolve the session, through a new helper `getSessionUser()` in `apps/web/src/lib/api.ts`. This reuses the existing `requireAuth` with all the BUG-01 checks (signature, expiry, revocation, account exists, role/version), and the web app doesn't need a copy of `JWT_SECRET`.
- **Responses.** Missing, fake, forged, expired or logged-out cookies get **401**. Any signed-in admin or editor (both edit content) gets 200. If the API can't be reached, the route returns 503 instead of failing open.
- **Editor UI.** The preview tab now says "Your session has ended. Sign in again to preview." on a 401, instead of silently showing "Nothing to preview".

**Files:** `apps/web/src/app/api/preview/route.ts`, `apps/web/src/lib/api.ts`, `apps/web/src/admin/inputs.tsx`

---

## 5. All files modified / added

**Modified (17)**
- `apps/api/package.json` (added a `test` script; no new dependencies)
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/modules/auth/user.model.ts`
- `apps/api/src/modules/dashboard/dashboard.routes.ts`
- `apps/api/src/modules/submissions/submissions.models.ts`
- `apps/api/src/modules/submissions/submissions.routes.ts`
- `apps/api/src/scripts/seed.ts`
- `apps/web/src/admin/Dashboard.tsx`
- `apps/web/src/admin/inputs.tsx`
- `apps/web/src/app/(site)/legal/[slug]/page.tsx`
- `apps/web/src/app/api/preview/route.ts`
- `apps/web/src/components/layout/AnnouncementBar.tsx`
- `apps/web/src/components/ui/Logo.tsx`
- `apps/web/src/lib/api.ts`
- `packages/types/src/common.ts`
- `packages/types/src/forms.ts`

**Added**
- `apps/api/src/tests/setup-env.ts`, `helpers.ts`: test environment and helpers
- `apps/api/src/tests/auth.test.ts`: BUG-01 and BUG-02
- `apps/api/src/tests/investor.test.ts`: BUG-04 and BUG-05 at the API level
- `apps/api/src/tests/phone.test.ts`: BUG-05 shared schema
- `BUG_FIX_IMPLEMENTATION_REPORT.md`: this file

**Database (local dev).** Mongoose `autoIndex` (on in development) created these indexes:
- `investorinterests`: `email_1` and `emailKey_unique` (the partial index built without problems alongside the existing duplicate rows)
- the new `revokedsessions` collection: `jti_1` and the `expiresAt_1` TTL index

No documents were modified or deleted.

---

## 6–7. Tests performed and actual results

### Automated tests: `npm test -w @preseedhealer/api`
The repo had no test runner. I added tests on Node's built-in `node:test`, run through `tsx` (already a devDependency).

The integration tests start the real Express app against a **throwaway database** (`preseedhealer_test_<pid>_<time>`). It is dropped when the run finishes, and the helper refuses to run against a database whose name doesn't contain "test". After the run, `listDatabases` showed only `admin`, `config`, `local` and `preseedhealer`.

**Result: 47 tests, 47 passed, 0 failed.** Coverage:

| Area | What the tests cover |
|---|---|
| BUG-01 | valid admin session → 200 · no cookie, `psh_session=anything`, wrong-secret signature → 401 · expired token → 401 · old-format token → 401 · logout → replayed token 401 (and cookie cleared), another device's session still 200 · logout with no or invalid cookie → 200 · deleted account → list 401 and create 401 · disabled account → 401 and login refused · demoted via Mongoose → old session 401, new login is an editor (content 200, applications 403) · demoted by a raw MongoDB update (bypassing hooks) → 401 · password change → other sessions 401, renewed cookie 200 |
| BUG-02 | admin dashboard includes 1 recent application · editor dashboard has none of `recentApplications`, `applications`, `investors`, `messages`, and the founder name appears nowhere in the response · editor → 403 on applications, applications CSV, investor-interests and messages |
| BUG-04 | same email twice → 201 then 409, 1 row · mixed case and whitespace → 409, 1 row · **6 concurrent identical submissions → exactly one 201 and five 409s, 1 row** · lead created before the fix (no `emailKey`) still blocks · existing duplicate rows don't block new leads · `emailKey` not exposed |
| BUG-05 | schema: 7 valid formats accepted, 12 invalid values rejected (including `1-------`, `12345`, letters, empty, whitespace-only) · API: `1-------`, `12345`, letters and empty → 400 with a `phone` field error · formatted international number → 201 · contact form: empty phone 201, `1-------` 400 |

### Type check: `npm run typecheck`
**Passed:** 3 of 3 packages (types, api, web), 0 errors.

### Production builds: `npm run build`
**Passed:** API (`tsup`) and web (`next build`, 45 static pages, TypeScript checked). Next 16 builds into `.next`, separate from the dev server's `.next/dev`, so the dev server kept running. Build outputs are gitignored.

### Lint
**Not run.** The repo has no ESLint, Prettier or Biome configuration and no `lint` script, and adding one would mean new dependencies.

### Live checks against the running dev servers
These went through the web origin's `/api/v1` proxy, like the browser. They used the seeded admin plus a temporary QA editor and QA investor rows, all deleted afterwards (0 left).

| Check | Result |
|---|---|
| Admin login → `/admin/posts` | 200 |
| Admin dashboard contains `recentApplications` | yes |
| Preview: no cookie / fake / forged signature / expired | 401 / 401 / 401 / 401 |
| Preview: valid admin | 200, `<h2 id="hi">hi</h2>` |
| Editor dashboard keys | `posts`, `partners` only |
| Editor → `/admin/applications` | 403 |
| Editor preview | 200 |
| Temp admin → applications, then demoted in MongoDB → same session | 200, then **401** |
| Deleted editor → posts / preview | 401 / 401 |
| Logout → same token on posts / `me` / preview | **401 / 401 / 401** |
| `/admin` with no cookie | 307 redirect to login |
| Investor: first submission, then the same email with different case and spacing | 201, then **409** with the friendly message; 1 row |
| Investor phone `1-------` | 400 |

### Browser checks (headless Chrome, DevTools Protocol)
**Responsive matrix.** 11 pages × 6 viewports (320, 375, 390, 768, 1024 and 1440 px) = **66 checks, 0 failures.** The pages were all 8 legal pages, one insights article, home and investors.
- Horizontal overflow (`scrollWidth − innerWidth`) = **0 everywhere**. The Cookie Policy was +154 px before the fix.
- The Cookie Policy table scrolls inside `.table-wrap` at ≤ 390 px, and the wrapper stays inside the viewport.
- Announcement text is never clipped, and the full message "Phase 01 applications open · Open until further notice" is visible.
- The header logo reads "PreSeedHealer" exactly once.
- **0 console errors or JS exceptions.**
- Screenshots (390 px Cookie Policy, 320 px and 1440 px header) were reviewed visually. They are in the session scratchpad, not the repo.

**UI flows** (0 console errors):
- `/investors/join` with phone `1-------` shows "Enter a valid phone number" and **sends no request**. A valid UK number clears the error.
- `/admin` redirects to login. Signing in loads the dashboard with "Recent applications".
- New article → Preview tab renders through `/api/preview`.
- Sign out lands on `/admin/login`, and `/admin/applications` redirects to login again.

---

## 8. Remaining issues and notes

1. **Deployment: every admin must sign in once.** Existing session cookies use the old format and are rejected after deployment.
2. **Production indexes.** `autoIndex` is off in production. Run `npm run seed:prod` (which calls `syncIndexes()`) after deploying to create `emailKey_unique`, `email_1` and the `revokedsessions` indexes. Without them:
   - the application-level duplicate check still works, but two exactly simultaneous submissions are not protected, and
   - revocation still works, but revoked-session rows won't expire automatically.
3. **Two database reads per admin request** (user + revoked session), both on indexed fields. This is negligible for admin traffic.
4. **No user-management UI.** Deactivating (`active: false`) or changing a role is done in MongoDB or a script, as before. Changes made with raw MongoDB still take effect immediately, because of the role check and the `active` check.
5. **Existing duplicate investor rows** (2 QA rows from the audit) were deliberately left in place. Admins can remove them from Admin → Investor leads if they want.
6. **The duplicate 409 reveals that an email has already registered.** This matches the existing behaviour of the application form; I'm noting it as a conscious product decision.
7. **Phone numbers with written extensions** (e.g. "ext 5") and numbers with fewer than 8 digits are rejected.
8. **On mobile, the announcement wraps at the "·" separator.** The wording comes from Admin → Settings, so a shorter or differently punctuated text can be set there if preferred.
9. **Not tested:**
   - the editor-role admin **UI** in a browser (editor behaviour was verified through the API, and the dashboard component guards on the returned data),
   - Safari, Firefox and real devices (only Chromium was available),
   - email delivery (SMTP not configured),
   - automated frontend unit tests (the web app has no test infrastructure; the frontend was verified with the browser scripts above, which are not committed).
10. **Audit items P-01 … P-08** (rate-limit design, CSP, login redirect, etc.) are outside the 8 bugs and were not changed.

## 9. Additional related bugs discovered and fixed

1. **Emails with surrounding spaces were rejected as invalid.** The shared schemas used `z.email().trim()`, and Zod 4 runs the email format check **before** the trim, so `" name@example.com "` got "Enter a valid email" (confirmed with a script). I added a shared `EmailSchema` (`z.string().trim().toLowerCase().pipe(z.email(...))`) and used it in the application, investor, contact and login schemas. This also makes BUG-04's normalisation reliable. Files: `packages/types/src/common.ts`, `packages/types/src/forms.ts`.
2. **Password change did not end other sessions.** It now bumps `tokenVersion` (other sessions → 401) and reissues the current cookie (part of the BUG-01 work).
3. **Rejected session cookies stayed in the browser**, so `proxy.ts` kept letting the browser into the admin shell, which then showed "Couldn't load the admin panel". `requireAuth` now clears a rejected cookie.
4. **The preview tab hid authentication failures** as "Nothing to preview". It now shows a sign-in message (BUG-08).

## 10. Git branch and working tree status

- Branch: **`fix/qa-audit-8-bugs`**. `main` was not touched. Nothing was committed, pushed or merged.
- Untracked files that existed before this work and were left untouched: `WEBSITE_QA_AUDIT_REPORT.md`, `apps/web/AGENTS.md`.
- New untracked files: `apps/api/src/tests/` and `BUG_FIX_IMPLEMENTATION_REPORT.md`.
- Modified tracked files: the 17 listed in §5.
- No environment files, secrets or production configuration were changed.
