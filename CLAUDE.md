# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing website for **CÔNG TY TNHH MTV Thiết kế và Xây dựng Sunwa** (Sunwa Design),
a residential construction/design company in Đà Nẵng, Vietnam. The UI is in **Vietnamese**.
Stack: vanilla HTML + **Tailwind CSS (CLI build)** + vanilla JS, with an **Azure Functions**
backend for the contact/quote form. Deploys to **Azure Static Web Apps**.

## Commands

```bash
npm install            # root deps: tailwindcss + @azure/static-web-apps-cli
npm run build:css      # compile css/tailwind.css -> css/style.css (REQUIRED after any class/markup change)
npm run watch:css      # recompile on change (run alongside dev)
npm run dev            # swa start . --api-location api  -> serves site + API at http://localhost:4280

cd api && npm install  # API deps (nodemailer); separate package.json
```

There is no test suite, linter, or framework build step — Tailwind compilation is the only build.

### Critical gotchas
- **Always run `npm run build:css` after editing any HTML, JS, or `tailwind.css`.** The committed
  `css/style.css` is the build output; if you change classes without rebuilding, the live styles
  won't match. Tailwind scans `./*.html` and `./js/**/*.js` (see `tailwind.config.js` `content`).
- **Tailwind scans JS string literals too.** A JS expression like `!grid` or a negation can be
  misread as a class and inject `!important` into the output. Keep local variable names from
  colliding with utility class names (this bit us before — `grid` was renamed to `gridEl`).
- **The site requires a web server — `file://` breaks it.** Pages use root-absolute asset paths
  (`/css/style.css`, `/js/main.js`) and pretty URLs (`/du-an`). Use `npm run dev`, not double-click.
- **The form API needs Node 18/20/22.** Azure Functions Core Tools v4 is incompatible with Node 24+.
  The static site/Tailwind build run on any recent Node, but to run `/api/submit` locally, switch to
  Node 20 (nvm-windows). `staticwebapp.config.json` pins `apiRuntime: node:20` for production.

## Architecture

### Pages (5 static HTML files at repo root)
`index.html`, `du-an.html` (projects), `dich-vu.html` (services), `bao-gia.html` (quote),
`lien-he.html` (contact). The navbar, footer, and floating action buttons are **inlined and
duplicated in every page** — there is no templating/include system, so shared-markup changes must
be applied to all five files. Pretty URLs (`/du-an` → `/du-an.html`) are rewrites defined in
`staticwebapp.config.json`, not real files.

### Client logic — `js/main.js` (single file, no modules/bundler)
`'use strict'`, IIFE-style `initX()` functions wired up on `DOMContentLoaded`. Key pieces:
- `PROJECTS` — hardcoded array of 7 sample projects (each has a `query` of Unsplash keywords used to
  build image URLs). `renderProjects()` injects cards into the projects grid.
- `PRICE_PER_M2` — lookup table driving `initCalculator()` (the cost estimator on the quote page).
- `initFilter()` (project type filter), `initModal()` (image lightbox), `initNavToggle()`,
  `initSmoothScroll()`, `initScrollReveal()` (IntersectionObserver), `initActiveNav()`.
- `initForms()` — client-side validation then `fetch` POST to `/api/submit`. The VN phone regex is
  `/^(0[3|5|7|8|9])+([0-9]{8})$/` and must stay in sync with the server copy.

### Form backend — `api/submit/`
Azure Function (HTTP trigger, anonymous, POST, route `submit`). `index.js`:
1. Re-validates server-side (name required, VN phone regex, `consent === 'yes'`) — the server is
   authoritative; never trust client validation alone.
2. Sends email via **nodemailer + Gmail SMTP**, reading config from env vars:
   `SMTP_USER`, `SMTP_PASS`, `TO_EMAIL`, `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT` (465).
3. Returns JSON `{ ok: true }` or `{ ok: false, error }` (Vietnamese error strings).

Local secrets live in `api/local.settings.json` (gitignored; copy from `.example`). In Azure they
are set under the Static Web App's environment variables. Requires a **Gmail App Password** (2FA on).

### The `/api/submit` contract (shared FE ⇄ BE)
Payload: `{ name, phone, email, type, area, address, message, consent }`. The `type` field maps to
`TYPE_LABELS` in `index.js` (`nha-pho`, `biet-thu`, `nha-cap-4`, `cai-tao`, `thiet-ke`). When changing
form fields, update **both** the HTML form, the JS in `main.js`, and `api/submit/index.js` together.

## Design tokens

All brand styling flows through `tailwind.config.js` `theme.extend` — change tokens there, not by
hardcoding values. Brand color `primary` `#B8520A` (cam đất), font **Be Vietnam Pro**, custom
breakpoints `sm:480 md:768 lg:1024 xl:1280`, `maxWidth.container` 1140px, nav height 64px.
Reusable component classes (`.btn-primary`, `.card`, `.project-card`, `.float-btn`, `.fade-in`) are
defined in `css/tailwind.css` under `@layer components`; `prefers-reduced-motion` is honored there.

## Deploy

Push to `main` → `.github/workflows/azure-static-web-apps.yml` runs `npm ci && npm run build:css`
and deploys (app_location `/`, api_location `api`, output_location empty, skip_app_build true).
Requires repo secret `AZURE_STATIC_WEB_APPS_API_TOKEN`. Full runbook in `docs/run-and-deploy.md`.

## Known TODOs before go-live
- Replace `source.unsplash.com` placeholder images with real project photos.
- Set the real canonical/OG domain (currently placeholder `https://sunwadesign.vn/...`).
- Fill in the real GPKD (business registration) number in the footer.
- Configure SMTP App Password in Azure environment variables.
