# Sunwa Design — Run Locally & Deploy to Azure

A step-by-step guide for (1) opening the website on your machine and (2) hosting it
on **Azure Static Web Apps** (static pages + the `/api` Functions backend + form email).

Commands are written for **Windows PowerShell** from the project root `D:\Sunwa_Design`.

---

## Part 1 — Open the web locally

### 1.1 One-time prerequisites
- **Node.js** (you have v24) and **npm** — check: `node --version` / `npm --version`.
- Install dependencies (root + API):
  ```powershell
  npm install
  cd api; npm install; cd ..
  ```
- Build the CSS (compiles `css/tailwind.css` → `css/style.css`):
  ```powershell
  npm run build:css
  ```

### 1.2 Two ways to view the site

**A) Quick look (open the file directly)**
- Double-click `index.html`, or open it in your browser.
- ✅ Layout, fonts, project cards, animations, mobile menu all work.
- ⚠️ Pretty URLs (`/du-an`) and the **contact/quote form won't work** over `file://` —
  the form needs the API server. Use option B for the real thing.

**B) Full local run (recommended) — the SWA emulator**
- Start the static site + routing:
  ```powershell
  npm run dev
  ```
  This runs `swa start` and serves everything at **http://localhost:4280**.
- Leave it running; open http://localhost:4280 in your browser. Pretty URLs and the
  security headers behave like production here.
- Optional second terminal — auto-rebuild CSS while you edit:
  ```powershell
  npm run watch:css
  ```

### 1.3 Make the form actually send email locally
The form POSTs to `/api/submit`, an Azure Function. To run it locally you need **Azure
Functions Core Tools** (`func`) plus SMTP credentials.

> **Node version matters.** Functions Core Tools v4 supports Node **18 / 20 / 22 (LTS)**
> only. On Node 24 you'll see *"Found Azure Functions Core Tools v4 which is incompatible
> with your current Node.js"* and the API won't start. Use a version manager to run the
> API on Node 20:
> ```powershell
> winget install CoreyButler.NVMforWindows   # one-time (uninstall standalone Node first)
> nvm install 20.18.1
> nvm use 20.18.1                             # node --version -> v20.x
> ```
> Switch back with `nvm use 24.13.1` when you're done with the API. The Tailwind build and
> the static `swa` server work fine on any recent Node.

1. Install `func` (one of these):
   ```powershell
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   # or:  winget install Microsoft.Azure.FunctionsCoreTools
   ```
   Verify: `func --version`
2. Create local secrets from the template:
   ```powershell
   Copy-Item api\local.settings.json.example api\local.settings.json
   ```
   Then edit `api\local.settings.json` and fill in the SMTP values (see **2.4** for how
   to get a Gmail App Password). This file is gitignored — never commit it.
3. Run `npm run dev` again. The SWA emulator now starts the API too. Submit the quote
   form → you should get a success message and an email in the inbox.

> Without `func`, the site still runs; only the form submission will fail locally.

---

## Part 2 — Hook it up to Azure (deploy)

The repo is already configured for Azure Static Web Apps:
- `staticwebapp.config.json` — routes, security headers, SPA fallback.
- `.github/workflows/azure-static-web-apps.yml` — CI that builds the CSS and deploys.
  Job inputs already set: `app_location: "/"`, `api_location: "api"`, `output_location: ""`.

You have two paths. **Path A (GitHub Actions)** is the standard, automatic one. **Path B
(SWA CLI)** is a manual push with no GitHub.

### 2.1 Prerequisites
- An **Azure account** (free tier works for Static Web Apps).
- For Path A: a **GitHub repository** with this code pushed.
- A **Gmail App Password** for the form email (see **2.4**).

### Path A — Deploy via GitHub (recommended)

1. **Push the code to GitHub** (if not already):
   ```powershell
   git add -A
   git commit -m "Sunwa Design site + Azure config"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. **Create the Static Web App** in the [Azure Portal](https://portal.azure.com):
   - **Create a resource → Static Web App → Create.**
   - Subscription + Resource Group (create one, e.g. `sunwa-rg`).
   - Name: `sunwa-design`. Plan type: **Free**. Region: pick the closest (e.g. East Asia).
   - **Deployment**: source **GitHub** → authorize → choose your **Org / Repo / Branch (main)**.
   - **Build Details**:
     - Build Presets: **Custom**
     - App location: `/`
     - Api location: `api`
     - Output location: *(leave empty)*
   - **Review + create.**
3. Azure adds a **deployment-token secret** to your GitHub repo and may commit its own
   workflow file. **Reconcile with the existing workflow** so you don't run two:
   - *Simplest:* delete Azure's generated workflow and keep
     `azure-static-web-apps.yml`. Confirm the repo has the secret
     **`AZURE_STATIC_WEB_APPS_API_TOKEN`** (GitHub → Settings → Secrets and variables →
     Actions). If it has a differently-named token secret, either rename it to
     `AZURE_STATIC_WEB_APPS_API_TOKEN` or update the `azure_static_web_apps_api_token`
     line in the workflow to match.
   - Every push to `main` now builds Tailwind and deploys automatically. Watch progress
     under the repo's **Actions** tab.
4. Configure the form's SMTP secrets in Azure — see **2.3**.

### Path B — Deploy manually with the SWA CLI (no GitHub)

1. Create the Static Web App in the Portal as in Path A, but choose **Deployment source:
   Other** (skip GitHub).
2. Get the deploy token: SWA resource → **Overview → Manage deployment token** → copy it.
3. Build, then deploy from your machine:
   ```powershell
   npm run build:css
   npx swa deploy . --api-location api --env production --deployment-token "<paste-token>"
   ```
4. Re-run that `swa deploy` command whenever you want to publish changes. Configure SMTP
   secrets as in **2.3**.

### 2.3 Configure the form email (Azure app settings)
The Function reads SMTP config from environment variables. Set them on the deployed app:

- SWA resource → **Settings → Environment variables** (a.k.a. Configuration) → **Add**:

  | Name | Value |
  |------|-------|
  | `SMTP_USER` | your Gmail address, e.g. `you@gmail.com` |
  | `SMTP_PASS` | the 16-char Gmail App Password (see 2.4) |
  | `TO_EMAIL`  | where leads should arrive, e.g. `Sunwa.design@gmail.com` |
  | `SMTP_HOST` | `smtp.gmail.com` |
  | `SMTP_PORT` | `465` |

- **Save**, then redeploy (or restart) so the Function picks them up. Never commit these.

### 2.4 Get a Gmail App Password
1. The Google account needs **2-Step Verification ON** (Google Account → Security).
2. Go to **Security → App passwords**, create one (name it "Sunwa site").
3. Copy the **16-character** password → use it as `SMTP_PASS`. Use the account's address
   as `SMTP_USER`.

> Gmail SMTP from a cloud host can occasionally be rate-limited or blocked. If delivery is
> flaky, switch the Function to a transactional provider (SendGrid/Mailgun) later.

### 2.5 Custom domain (optional)
1. SWA resource → **Custom domains → Add** → enter your domain (e.g. `sunwadesign.vn`).
2. Add the **CNAME/TXT records** Azure shows to your domain's DNS, then validate.
3. Update the placeholder URLs in the pages to the real domain:
   - `<link rel="canonical" ...>` and the `og:` / canonical URLs in each `*.html` `<head>`
     (currently `https://sunwadesign.vn/...`).

---

## Post-deploy checklist
- [ ] Site loads at the Azure URL (`https://<name>.azurestaticapps.net`).
- [ ] Pretty URLs work: `/du-an`, `/dich-vu`, `/bao-gia`, `/lien-he`.
- [ ] Submit the quote form → success message → email arrives at `TO_EMAIL`.
- [ ] Security headers present (DevTools → Network → response headers:
      `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- [ ] Replace the placeholder Unsplash images with real project photos.
- [ ] Set the real GPKD (business registration) number in the footer.
- [ ] Canonical/OG URLs point to the real domain.

## Handy commands
```powershell
npm run build:css     # compile Tailwind once
npm run watch:css     # recompile on change
npm run dev           # run site + API locally (http://localhost:4280)
func --version        # confirm Azure Functions Core Tools installed
npx swa deploy . --api-location api --deployment-token "<token>"   # manual deploy
```
