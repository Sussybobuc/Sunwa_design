# Plan: Client portal under the Warranty button (/bao-hanh — certificate + hồ sơ lookup)

## Context
The client (Sunwa company) wants customers to access their own construction records. The hero button
**"Giấy Chứng nhận Bảo hành"** (`index.html:68`, `data-insurance`, currently opens
`Materials/Insurance.webp` via `initInsuranceModal()` in `js/main.js:382`) becomes the entry to a new
**/bao-hanh** page with **two tabs**:
1. **Giấy chứng nhận** — the existing warranty certificate image (click to zoom in the existing lightbox).
2. **Tra cứu hồ sơ** — client login → dashboard showing their contract docs, design files,
   construction log (nhật ký thi công), and a 3-tier warranty countdown.

Decisions made with the user:
- **Login = contract code (mã hợp đồng) + phone number** — both issued/known by the company; no passwords.
- **Data = file-based, no admin UI now** ("hybrid"): a git-ignored `Private/clients/` folder + one
  `clients.json`; a password-protected admin page is **phase 2**, designed separately later.
- **Countdown = 3 warranties from one handover date** (kết cấu 5y · chống thấm 3y · hoàn thiện 1y,
  per-client override possible), shown as progress bars with time remaining / "Đã hết hạn".

This is the site's first authenticated feature. It must not weaken the existing static site: no DB,
no new heavy deps, PII stays out of git (`Private/` is already git-ignored).

## Architecture

### Session approach (considered alternatives)
- **Chosen: stateless HMAC-signed cookie** — on login, set HttpOnly `SameSite=Lax` cookie
  `sunwa_client = <code>.<expiry>.<HMAC-SHA256(code.expiry, SESSION_SECRET)>` (24h). Node's built-in
  `crypto` (`createHmac`, `timingSafeEqual`) — zero new deps; survives `pm2 reload` (deploys don't log
  clients out); file downloads work as plain `<a href>` links because the browser sends the cookie.
- Rejected: in-memory session map (wiped by every deploy/reload); token in localStorage + fetch-only
  downloads (can't use plain links, XSS-exposed).
- Cookie parsing: tiny helper (split `;`) — not worth the `cookie-parser` dep.

### Data model — `Private/clients/clients.json` (git-ignored, lives only on the Mac + backups)
```json
{
  "HD-2026-014": {
    "name": "Nguyễn Văn A",
    "phone": "0912345678",
    "project": "Nhà phố 3 tầng — Hải Châu, Đà Nẵng",
    "handover": "2026-03-15",
    "warranty": { "ketCau": 5, "chongTham": 3, "hoanThien": 1 },
    "docs": [
      { "file": "hop-dong.pdf", "label": "Hợp đồng thi công" },
      { "file": "thiet-ke.pdf", "label": "Hồ sơ thiết kế" }
    ],
    "logs": [
      { "date": "2026-01-10", "text": "Hoàn thành đổ móng", "photos": ["nhat-ky/mong-1.jpg"] }
    ]
  }
}
```
Files live in `Private/clients/<code>/…`. `handover: null` = still under construction (dashboard says
"đang thi công", no countdown). `warranty` optional (defaults 5/3/1). Loaded per request via a small
mtime-cached reader so edits apply without restart.

### Backend — new `lib/portal.js` (mirrors the `lib/mailer.js` handler pattern) + `server.js` wiring
- `POST /api/tra-cuu/login` `{code, phone}` → normalize, look up, compare phone; success → set cookie,
  return client payload. Failure → generic 401 "Mã hợp đồng hoặc số điện thoại không đúng." (no hint
  which was wrong). **Rate-limited** with the existing `express-rate-limit` (10 / 15 min / IP —
  reuse the limiter pattern in `server.js`).
- `GET /api/tra-cuu/me` → validate cookie → same payload (page refresh keeps session).
- `POST /api/tra-cuu/logout` → clear cookie.
- `GET /ho-so/<code>/<file…>` → validate cookie, **cookie code must equal URL code**, resolve with
  `path.normalize` and require the result stays inside `Private/clients/<code>/` (traversal guard),
  then `res.sendFile`. `Cache-Control: private, no-store`.
- Payload includes doc/photo URLs pointing at `/ho-so/<code>/…`; warranty countdown is computed
  client-side from `handover` + durations.
- New env: `SESSION_SECRET` (add to `.env.example`; generate 32-byte random into the Mac's `.env` at
  implementation time).

### Frontend
- **`bao-hanh.html`** (new, from the landing-page template): standard navbar/footer/floating buttons
  (→ **8 HTML files now share the navbar** — update them all + `CLAUDE.md`'s count). Two tabs
  (custom classes, e.g. `.tab-btn`/`.is-active` — never Tailwind utility names in raw CSS):
  - Tab "Giấy chứng nhận": `Materials/Insurance.webp` inline (`loading="lazy"`, width/height set),
    click opens the existing lightbox via `openImageModal` — reuse, don't duplicate.
  - Tab "Tra cứu hồ sơ": login form (mã hợp đồng + SĐT — reuse the shared VN phone regex) → on
    success swaps to the dashboard: project header, docs list (download links), log timeline
    (date + text + photo thumbnails opening in the lightbox), and the 3 countdown bars.
  - Indexed page (real content): canonical/OG like main pages, add to `sitemap.xml`.
- **`index.html`**: hero `<button data-insurance>` → `<a href="/bao-hanh" class="btn-ghost">` (same
  icon/label). `initInsuranceModal()` stays (it no-ops without `[data-insurance]`) but gets rewired to
  the certificate image on /bao-hanh.
- **`js/main.js`**: new `initTraCuu()` (fetch login → render dashboard; `escapeHtml()` on every
  rendered field; auto-login attempt via `/me` on page load) + tiny tab switcher. Wire into the
  `DOMContentLoaded` block.
- **`css/tailwind.css`**: tab styles + countdown bar styles under `@layer components`, custom class
  names only. **Load the `dataviz` skill before styling the countdown bars.**
- **`server.js`**: add `/bao-hanh` to `PAGES`; mount the portal routes.

### Sample data + docs
- Create `Private/clients/clients.json` with 1 demo client (fake data) + a small sample PDF/photo so
  the flow is testable end-to-end; real clients get added by the company later.
- Document the data format + how staff add a client in **`deploy/client-portal.md`** (deploy/ is
  tracked; `docs/` and `Private/` are git-ignored). Note `Private/clients/` joins `.env` on the
  "back this up — not in git" list (mention in `deploy/README.md`).
- Per the brainstorming skill: also commit the design spec to
  `docs/superpowers/specs/2026-07-12-client-portal-design.md` — **`git add -f`** needed since
  `docs/` is git-ignored (matches how run-and-deploy.md is already tracked-despite-ignored).

## Security checklist (small surface, but it's the first auth feature)
- Generic login error; login rate-limited; `timingSafeEqual` for phone + HMAC comparisons.
- HttpOnly + SameSite=Lax cookie (no JS access; `Secure` flag added when behind HTTPS/tunnel).
- File route: cookie-vs-URL code match + traversal guard; `no-store`.
- All client-supplied and file-derived strings rendered through `escapeHtml`.
- No client PII in git, logs, or error messages.

## Out of scope (phase 2+)
Admin upload UI, password auth, SMS/OTP, per-doc permissions, multiple contracts per phone,
Cloudflare Access hardening. Domain/DNS work continues separately in the main session.

## Files
- **Create:** `bao-hanh.html`, `lib/portal.js`, `deploy/client-portal.md`,
  `Private/clients/clients.json` (+ sample files, not committed), spec doc (committed with `-f`).
- **Edit:** `server.js`, `js/main.js`, `css/tailwind.css`, `index.html` (hero button), the other
  7 HTML files only if the navbar gains nothing new (it doesn't — no new nav link; navbar untouched),
  `.env.example` (+ `SESSION_SECRET`), Mac's `.env`, `sitemap.xml`, `CLAUDE.md` (architecture:
  8 pages, portal section), `deploy/README.md` (backup note).
- **Rebuild:** `npm run build:css` (verify 0 `!important`).

## Verification
1. `node --check` on server.js/portal.js/main.js; `npm run build:css` → 0 `!important`.
2. curl battery: login wrong phone → 401 generic; right → 200 + `Set-Cookie`; `/api/tra-cuu/me`
   without cookie → 401, with → 200; `/ho-so/HD-x/hop-dong.pdf` without cookie → 401, with wrong
   client's cookie → 403, with right cookie → 200 PDF; `/ho-so/HD-x/../../.env` → blocked; 11 rapid
   logins → 429.
3. Browser (`open http://localhost:3000/bao-hanh`): tabs switch; certificate zooms in lightbox;
   demo login renders docs, logs with photos, 3 countdown bars (check the math against the demo
   handover date, including an already-expired tier); refresh keeps session; logout clears it.
4. Re-run the existing backend test battery (`/tmp/backend-test.sh`) — no regressions.
5. Push → self-hosted runner deploys → re-test the demo login on the deployed app; verify session
   survives `pm2 reload` (deploy) thanks to the stateless cookie.
6. Phone on LAN (`http://192.168.10.67:3000/bao-hanh`): mobile layout of tabs/dashboard/countdown.
