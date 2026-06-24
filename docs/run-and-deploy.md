# Sunwa Design — Run Locally & Deploy to Azure

A step-by-step guide for (1) opening the website on your machine and (2) hosting it
on **Azure App Service** (an Express app serving the static pages + the `/api/submit`
form-email backend).

Commands are written for **Windows PowerShell** from the project root `D:\Sunwa_Design`.

---

## Part 1 — Run the website locally

### 1.1 One-time prerequisites
- **Node.js** and **npm** — check: `node --version` / `npm --version`.
- Install dependencies:
  ```powershell
  npm install
  ```
- Build the CSS (compiles `css/tailwind.css` → `css/style.css`):
  ```powershell
  npm run build:css
  ```

### 1.2 Start the server
```powershell
npm start
```
This runs `node server.js` and serves everything at **http://localhost:3000** — static
pages, pretty URLs (`/du-an`, `/dich-vu`, `/bao-gia`, `/lien-he`), the security headers,
and the `/api/submit` form endpoint.

Open http://localhost:3000 in your browser. Leave the server running while you browse.

> The site needs a web server — opening `index.html` over `file://` breaks pretty URLs,
> root-absolute asset paths, and the form. Always use `npm start`.

Optional second terminal — auto-rebuild CSS while you edit:
```powershell
npm run watch:css
```

### 1.3 Make the form actually send email locally
The form POSTs to `/api/submit`. Without SMTP credentials the endpoint returns a 500
"Hệ thống gửi email chưa được cấu hình" message — the rest of the site still works.

To send real email locally, set the SMTP env vars in the **same** PowerShell session
before `npm start` (see **2.3** for how to get a Gmail App Password):
```powershell
$env:SMTP_USER = "you@gmail.com"
$env:SMTP_PASS = "your-16-char-app-password"
$env:TO_EMAIL  = "Sunwa.design@gmail.com"   # optional; this is the default
npm start
```
Submit the quote form → you should get a success message and an email in the inbox.
These env vars only live for that terminal session — never commit secrets.

---

## Part 2 — Deploy to Azure App Service

### 2.1 Prerequisites
- An **Azure account**.
- A **GitHub repository** with this code pushed (Deployment Center pulls from GitHub).
- A **Gmail App Password** for the form email (see **2.3**).

### 2.2 Create the Web App and connect GitHub
1. **Push the code to GitHub** (if not already):
   ```powershell
   git add -A
   git commit -m "Sunwa Design Express app"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. **Create the Web App** in the [Azure Portal](https://portal.azure.com):
   - **Create a resource → Web App → Create.**
   - Subscription + Resource Group (create one, e.g. `sunwa-rg`).
   - Name: `sunwa-design` (becomes `https://sunwa-design.azurewebsites.net`).
   - Publish: **Code**. Runtime stack: **Node 20 LTS**. OS: **Linux**.
   - Region: pick the closest (e.g. East Asia). Pricing plan: choose to taste (Free/Basic).
   - **Review + create.**
3. **Connect deployment** — Web App → **Deployment Center**:
   - Source: **GitHub** → authorize → choose your **Org / Repo / Branch (main)**.
   - Build provider: **GitHub Actions** (Azure generates and commits a workflow that runs
     `npm install` + `npm run build:css` and deploys). Save.
   - App Service runs the app with `npm start` (from the `start` script). The `engines`
     field pins Node 20.
   - Every push to `main` now builds and redeploys. Watch progress under the repo's
     **Actions** tab and the Deployment Center logs.
4. Configure the form's SMTP secrets — see **2.3 / app settings** below.

### 2.3 Configure the form email (App Service application settings)
The server reads SMTP config from environment variables. Set them on the deployed app:

- Web App → **Settings → Configuration → Application settings → New application setting**:

  | Name | Value |
  |------|-------|
  | `SMTP_USER` | your Gmail address, e.g. `you@gmail.com` |
  | `SMTP_PASS` | the 16-char Gmail App Password (see below) |
  | `TO_EMAIL`  | where leads should arrive, e.g. `Sunwa.design@gmail.com` |
  | `SMTP_HOST` | `smtp.gmail.com` |
  | `SMTP_PORT` | `465` |

- **Save** (this restarts the app so it picks up the new settings). Never commit these.

**Get a Gmail App Password:**
1. The Google account needs **2-Step Verification ON** (Google Account → Security).
2. Go to **Security → App passwords**, create one (name it "Sunwa site").
3. Copy the **16-character** password → use it as `SMTP_PASS`. Use the account's address
   as `SMTP_USER`.

> Gmail SMTP from a cloud host can occasionally be rate-limited or blocked. If delivery is
> flaky, switch to a transactional provider (SendGrid/Mailgun) later.

### 2.4 Custom domain (optional)
1. Web App → **Custom domains → Add custom domain** → enter your domain (e.g. `sunwadesign.vn`).
2. Add the **CNAME/TXT records** Azure shows to your domain's DNS, then validate, and add a
   managed certificate for HTTPS.
3. Update the placeholder URLs in the pages to the real domain:
   - `<link rel="canonical" ...>` and the `og:` / canonical URLs in each `*.html` `<head>`
     (currently `https://sunwadesign.vn/...`).

---

## Post-deploy checklist
- [ ] Site loads at the Azure URL (`https://<name>.azurewebsites.net`).
- [ ] Pretty URLs work: `/du-an`, `/dich-vu`, `/bao-gia`, `/lien-he`.
- [ ] Submit the quote form → success message → email arrives at `TO_EMAIL`.
- [ ] Security headers present (DevTools → Network → response headers:
      `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- [ ] Replace the placeholder Unsplash images with real project photos.
- [ ] Set the real GPKD (business registration) number in the footer.
- [ ] Canonical/OG URLs point to the real domain.

## Handy commands
```powershell
npm install           # install dependencies
npm run build:css     # compile Tailwind once
npm run watch:css     # recompile on change
npm start             # run the site + API locally (http://localhost:3000)
```
