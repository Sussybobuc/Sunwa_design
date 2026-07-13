# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing website for **CÔNG TY TNHH MTV Thiết kế và Xây dựng Sunwa** (Sunwa Design),
a residential construction/design company in Đà Nẵng, Vietnam. The UI is in **Vietnamese**.
Stack: vanilla HTML + **Tailwind CSS (CLI build)** + vanilla JS, served by a small **Express**
app (`server.js`) that also hosts the contact/quote form backend. **Self-hosted on a Mac Mini M4**
behind a Cloudflare Tunnel at `https://sunwadesign.com` (see `deploy/README.md`).

## Commands

```bash
npm install            # root deps: express, nodemailer (runtime) + tailwindcss (dev)
npm run build:css      # compile css/tailwind.css -> css/style.css (REQUIRED after any class/markup change)
npm run watch:css      # recompile on change (run alongside the server)
npm start              # node server.js -> serves site + API at http://localhost:3000
```

First-time local run: `npm install`, then `npm run build:css`, then `npm start`.

There is no test suite, linter, or framework build step — Tailwind compilation is the only build.

### Critical gotchas
- **Always run `npm run build:css` after editing any HTML, JS, or `tailwind.css`.** The committed
  `css/style.css` is the build output; if you change classes without rebuilding, the live styles
  won't match. Tailwind scans `./*.html` and `./js/**/*.js` (see `tailwind.config.js` `content`).
- **Tailwind scans JS string literals too.** A JS expression like `!grid` or a negation can be
  misread as a class and inject `!important` into the output. Keep local variable names from
  colliding with utility class names (this bit us before — `grid` was renamed to `gridEl`).
- **The site requires a web server — `file://` breaks it.** Pages use root-absolute asset paths
  (`/css/style.css`, `/js/main.js`) and pretty URLs (`/du-an`). Use `npm start`, not double-click.
- **Node version.** `package.json` `engines` pins `node: 20.x` (App Service targets Node 20 LTS).
  The Express server and the form API run on any recent Node locally; production runs on Node 20.

## Architecture

### Pages (6 static HTML files at repo root)
`index.html`, `du-an.html` (projects), `dich-vu.html` (services), `bao-gia.html` (quote),
`lien-he.html` (contact), `bao-hanh.html` (warranty + client portal). The navbar, footer, and
floating action buttons are **inlined and duplicated in every page** — there is no
templating/include system, so shared-markup changes must be applied to all of them. Pretty URLs
(`/du-an` → `du-an.html`) are routes registered in `server.js` (the `PAGES` map), not real files.

### Navbar section links — Quản lý chất lượng & Hệ thống pháp lý
The navbar has two plain nav links (`<a class="nav-link">`): **"Quản lý chất lượng"**
(`/quan-ly-chat-luong`) and **"Hệ thống pháp lý"** (`/he-thong-phap-ly`), sitting between "Dự án" and
"Liên hệ". No dropdown/JS — each points to a single placeholder landing page (`quan-ly-chat-luong.html`
/ `he-thong-phap-ly.html`) showing "Nội dung đang được cập nhật". Routes are in `server.js` `PAGES`.

> History: these used to be hover/click **dropdowns** (5 + 3 subsection pages, `SECTION_MENUS` +
> `initSectionDropdowns()` in `js/main.js`, `.nav-dropdown*` CSS). That was removed — the 8 subpages,
> the JS, and the CSS are all gone. Don't reintroduce `nav-dropdown` markup/classes.

There are **8 HTML files with identical navbar markup** (6 main + the 2 landing pages) — apply any
shared-navbar change to all of them.

### Mobile nav — left slide-out drawer
Below `md` (768px) the navbar (`#nav-menu`) is a **drawer that slides in from the left** (sits below
the 64px sticky header so the header's hamburger/X stays the close button). **<480px:** full-width,
**no dim**. **480–767px:** ~300px drawer with a **dim backdrop** over the rest of the page. The
backdrop `<div class="nav-backdrop">` is **injected by `initNavToggle()`** (`js/main.js`) — not in the
HTML; open/close toggles `.is-open` on both `#nav-menu` and the backdrop, locks page scroll
(`body.style.overflow`), and resets when crossing to desktop. Closes via X / backdrop-tap / Esc /
link-click. Styles live in `css/tailwind.css` `@media (max-width:767px)` keyed on `#nav-menu` /
`.nav-backdrop` (custom selectors only — never Tailwind utility names in raw CSS).

### Client logic — `js/main.js` (single file, no modules/bundler)
`'use strict'`, IIFE-style `initX()` functions wired up on `DOMContentLoaded`. Key pieces:
- `PROJECTS` — hardcoded array of 7 sample projects (each has a `query` of Unsplash keywords used to
  build image URLs). `renderProjects()` injects cards into the projects grid.
- `PRICE_PER_M2` — lookup table driving `initCalculator()` (the cost estimator on the quote page).
- `initFilter()` (project type filter), `initModal()` (image lightbox), `initNavToggle()`,
  `initSmoothScroll()`, `initScrollReveal()` (IntersectionObserver), `initActiveNav()`.
- `initForms()` — client-side validation then `fetch` POST to `/api/submit`. The VN phone regex is
  `/^(0[3|5|7|8|9])+([0-9]{8})$/` and must stay in sync with the server copy.

### Form backend — `server.js` + `lib/mailer.js`
`server.js` registers `POST /api/submit`, which calls `handleSubmit(req.body)` from `lib/mailer.js`.
`handleSubmit(data)` returns `{ status, body }`:
1. Re-validates server-side (name required, VN phone regex, `consent === 'yes'`) — the server is
   authoritative; never trust client validation alone.
2. Sends email via **nodemailer + Gmail**, reading config from env vars. **Auth is OAuth2-first:**
   if `OAUTH_CLIENT_ID` + `OAUTH_CLIENT_SECRET` + `OAUTH_REFRESH_TOKEN` are all set it uses an
   OAuth2 transport (`type: 'OAuth2'`, `user: SMTP_USER`); otherwise it falls back to password auth
   via `SMTP_PASS` (Gmail App Password). Also reads `SMTP_USER` (sending address, required),
   `TO_EMAIL`, `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT` (465).
3. Returns JSON `{ ok: true }` or `{ ok: false, error }` (Vietnamese error strings).

Config comes from **`.env`** next to `server.js` (loaded by `dotenv` at startup; keys documented in
`.env.example`; the real file is git-ignored, chmod 600, on the Mac Mini). Leave it absent and the
route returns a 500 "chưa được cấu hình" message. Preferred: **Gmail OAuth2** (client ID/secret +
refresh token), since Google is deprecating App Passwords. See `docs/run-and-deploy.md` §2.3.

### Client portal — `/bao-hanh` + `lib/portal.js`
The hero "Giấy Chứng nhận Bảo hành" button links to `/bao-hanh`: tab 1 shows the warranty
certificate (`Materials/Insurance.webp`, zooms via the shared lightbox), tab 2 is a client login
(**registered phone number only** — the phone is the whole credential; must be unique per client)
→ dashboard with docs, construction logs, and a 3-tier warranty countdown
(kết cấu 5y · chống thấm 3y · hoàn thiện 1y from `handover`). Backend: `lib/portal.js` — stateless
HMAC-signed HttpOnly cookie (`SESSION_SECRET` env, 24h), routes `/api/tra-cuu/login|me|logout`
(login rate-limited 10/15min) and authenticated downloads at `/ho-so/<code>/<file>` (cookie code
must match URL code; traversal-guarded). **Data lives in git-ignored `Private/clients/`**
(`clients.json` + one folder per client, mtime-cached — staff edit files directly, no admin UI;
format doc: `deploy/client-portal.md`). Demo login: phone `0900000001`. Frontend:
`initTabs()` + `initTraCuu()` in `js/main.js`; `.tab-*`/`.wr-*` styles in `css/tailwind.css`.
Never commit client PII; `Private/clients/` + `.env` are the two backup-outside-git items.

### The `/api/submit` contract (shared FE ⇄ BE)
Payload: `{ name, phone, email, type, area, address, message, consent }`. The `type` field maps to
`TYPE_LABELS` in `lib/mailer.js` (`nha-pho`, `biet-thu`, `nha-cap-4`, `cai-tao`, `thiet-ke`). When
changing form fields, update **both** the HTML form, the JS in `main.js`, and `lib/mailer.js` together.

### Media — the `Materials/` folder
Real photos/videos for the site live in `Materials/`, served publicly at `/materials/...` (static
route in `server.js`, 30-day cache). To keep the site light, **every upload must follow the
weight-control checklist in [`Materials/README.md`](Materials/README.md)** (WebP/AVIF, set
`width`/`height`, `loading="lazy"`, `<picture>`+`srcset` for responsive, `preload="none"`+`poster`
for video). The hero "Giấy chứng nhận bảo hiểm" button opens `Materials/Insurance.webp` in the
shared lightbox modal.

## Design tokens

All brand styling flows through `tailwind.config.js` `theme.extend` — change tokens there, not by
hardcoding values. Brand color `primary` `#B8520A` (cam đất), font **Be Vietnam Pro**, custom
breakpoints `sm:480 md:768 lg:1024 xl:1280`, `maxWidth.container` 1140px, nav height 64px.
Reusable component classes (`.btn-primary`, `.card`, `.project-card`, `.float-btn`, `.fade-in`) are
defined in `css/tailwind.css` under `@layer components`; `prefers-reduced-motion` is honored there.

## Deploy

**Self-hosted on a Mac Mini M4** (this machine, `~/Projects/Sunwa_Design`) behind an outbound-only
**Cloudflare Tunnel** (`sunwa`) serving `https://sunwadesign.com` (+ `www`, + `test.` for staging).
Push to `main` → `.github/workflows/selfhost-deploy.yml` runs on the Mac's own GitHub runner:
`git pull` → `npm ci` → `npm run build:css` → `pm2 reload sunwa` → health check. The app runs under
**pm2** (`ecosystem.config.js`), boots pre-login via LaunchDaemons. Secrets live in the git-ignored
`.env`. Full runbook: **`deploy/README.md`**.

> Legacy: the old **Azure App Service** deploy (`.github/workflows/main_sunwa-design.yml`) still runs
> in parallel as a fallback during the transition window — delete the Web App + that workflow once
> the Mac has been stable ~1 week (cutover was 2026-07-13).

## Known TODOs before go-live
- Replace `source.unsplash.com` placeholder images with real project photos.
- Fill in the real GPKD (business registration) number in the footer.
- Decommission Azure after the stability window (see Deploy above).
