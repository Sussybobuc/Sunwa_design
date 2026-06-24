# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing website for **CÔNG TY TNHH MTV Thiết kế và Xây dựng Sunwa** (Sunwa Design),
a residential construction/design company in Đà Nẵng, Vietnam. The UI is in **Vietnamese**.
Stack: vanilla HTML + **Tailwind CSS (CLI build)** + vanilla JS, served by a small **Express**
app (`server.js`) that also hosts the contact/quote form backend. Deploys to **Azure App Service**.

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

### Pages (5 static HTML files at repo root)
`index.html`, `du-an.html` (projects), `dich-vu.html` (services), `bao-gia.html` (quote),
`lien-he.html` (contact). The navbar, footer, and floating action buttons are **inlined and
duplicated in every page** — there is no templating/include system, so shared-markup changes must
be applied to all five files. Pretty URLs (`/du-an` → `du-an.html`) are routes registered in
`server.js` (the `PAGES` map), not real files.

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
2. Sends email via **nodemailer + Gmail SMTP**, reading config from env vars:
   `SMTP_USER`, `SMTP_PASS`, `TO_EMAIL`, `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT` (465).
3. Returns JSON `{ ok: true }` or `{ ok: false, error }` (Vietnamese error strings).

Locally, set the SMTP env vars in your shell before `npm start` (or leave them unset — the route
returns a 500 "chưa được cấu hình" message). In Azure they are set under the App Service's
**Application settings**. Requires a **Gmail App Password** (2FA on).

### The `/api/submit` contract (shared FE ⇄ BE)
Payload: `{ name, phone, email, type, area, address, message, consent }`. The `type` field maps to
`TYPE_LABELS` in `lib/mailer.js` (`nha-pho`, `biet-thu`, `nha-cap-4`, `cai-tao`, `thiet-ke`). When
changing form fields, update **both** the HTML form, the JS in `main.js`, and `lib/mailer.js` together.

## Design tokens

All brand styling flows through `tailwind.config.js` `theme.extend` — change tokens there, not by
hardcoding values. Brand color `primary` `#B8520A` (cam đất), font **Be Vietnam Pro**, custom
breakpoints `sm:480 md:768 lg:1024 xl:1280`, `maxWidth.container` 1140px, nav height 64px.
Reusable component classes (`.btn-primary`, `.card`, `.project-card`, `.float-btn`, `.fade-in`) are
defined in `css/tailwind.css` under `@layer components`; `prefers-reduced-motion` is honored there.

## Deploy

Deploys to **Azure App Service** (Linux, Node 20 LTS). Create a Web App, then wire it to GitHub via
**Deployment Center → GitHub** so pushes to `main` build (`npm install` + `npm run build:css`) and
restart the app (`npm start`). Set the SMTP secrets under **App Service → Configuration → Application
settings** (`SMTP_USER`, `SMTP_PASS`, `TO_EMAIL`, `SMTP_HOST`, `SMTP_PORT`). Full runbook in
`docs/run-and-deploy.md`.

## Known TODOs before go-live
- Replace `source.unsplash.com` placeholder images with real project photos.
- Set the real canonical/OG domain (currently placeholder `https://sunwadesign.vn/...`).
- Fill in the real GPKD (business registration) number in the footer.
- Configure SMTP App Password in App Service → Configuration → Application settings.
