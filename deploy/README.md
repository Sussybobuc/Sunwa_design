# Self-hosting on the Mac Mini M4 — runbook

The site runs on a Mac Mini M4 (24 GB, macOS, `arm64`) at the office/home — the ONLY production
environment (Azure App Service was decommissioned 2026-07-16).

## Architecture

```
Internet → Cloudflare edge (TLS, DDoS) → outbound-only tunnel (cloudflared)
        → localhost:3000 (Express, pm2 "sunwa") → Gmail OAuth2 SMTP for the quote form
```

- **No inbound ports are open** on the router. `cloudflared` and Tailscale both connect outbound.
- Admin access from outside: **Tailscale** (SSH over the tailnet only — never port-forward SSH).
- **Back up `~/Projects/Sunwa_Design/.env` AND `Private/clients/`** — the only two things not in git
  (mail/session secrets and client-portal data; see `deploy/client-portal.md`).

## What's installed where

| Piece | Location | Runs as |
|---|---|---|
| App clone (canonical) | `~/Projects/Sunwa_Design` | user `nhathuy` |
| Mail secrets | `~/Projects/Sunwa_Design/.env` (chmod 600, git-ignored) | — |
| pm2 process | `pm2` name `sunwa`, dump in `~/.pm2/dump.pm2` | user `nhathuy` |
| pm2 boot daemon | `/Library/LaunchDaemons/com.sunwa.pm2.plist` (copy of `deploy/com.sunwa.pm2.plist`) | root → runs `pm2 resurrect` as `nhathuy` at boot, pre-login |
| Tunnel config | `/etc/cloudflared/config.yml` + credentials JSON (daemon copy); working copy in `~/.cloudflared/` | — |
| Tunnel daemon | `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist` | root |
| CI runner | `~/actions-runner` (`sunwa-mac-mini`, labels `self-hosted,macOS,ARM64`) | LaunchAgent (starts at login) |

Tunnel: name `sunwa`, ID `7b911984-e908-4c24-81f5-ff17e0538223`. Ingress: `test.sunwadesign.com`,
`sunwadesign.com` and `www.sunwadesign.com` → `http://localhost:3000`, everything else → 404.
The domain was bought via **Cloudflare Registrar** (DNS lives on Cloudflare automatically).

> **Gotcha (already fixed once):** `cloudflared service install` writes a plist that launches
> `cloudflared` with **no arguments**, which modern versions refuse. The plist's `ProgramArguments`
> must be `cloudflared --config /etc/cloudflared/config.yml tunnel run`.

## Power / boot settings

`pmset`: `sleep 0`, `disablesleep 1`, `autorestart 1` (power-on after outage), `powernap 0`.
The site comes back after a reboot **without anyone logging in** (pm2 + cloudflared are system
LaunchDaemons). The CI runner is a LaunchAgent, so queued deploys start after first login.

## Deploys

Push to `main` → `.github/workflows/selfhost-deploy.yml` runs on the Mac's own runner:
`git pull --ff-only` → `npm ci` → `npm run build:css` → `pm2 reload sunwa` → `/healthz` check.

Manual deploy (if the runner is down): same commands, from `~/Projects/Sunwa_Design`.

## Operations

```bash
pm2 ls / pm2 logs sunwa / pm2 reload sunwa      # app status / logs / hot reload
curl localhost:3000/healthz                      # health probe
tail -f /Library/Logs/com.cloudflare.cloudflared.err.log   # tunnel log (INF lines are normal)
cloudflared tunnel info sunwa                    # tunnel connection status
cd ~/actions-runner && ./svc.sh status           # CI runner service
```

Restart daemons (Terminal, admin):
```bash
sudo launchctl kickstart -k system/com.cloudflare.cloudflared   # tunnel
sudo launchctl kickstart -k system/com.sunwa.pm2                # pm2 resurrect (one-shot)
```

## Daily backup — `Private/clients` + `.env`

The 08:00 health check also snapshots the two things that live outside git:
`~/Backups/sunwa-clients/sunwa-YYYY-MM-DD.tar.gz` (chmod 600, newest 30 kept; failure = alert
email like any other check). Same-disk only — protects against accidental deletion, NOT disk
death; keep Time Machine (or an occasional copy of that folder to an external drive) for that.

**Restore** (all clients, or cherry-pick one folder):
```bash
cd ~/Projects/Sunwa_Design
tar -xzf ~/Backups/sunwa-clients/sunwa-<date>.tar.gz Private/clients   # everything
tar -xzf ~/Backups/sunwa-clients/sunwa-<date>.tar.gz Private/clients/HD-2026-001  # one client's files
```
(clients.json is inside `Private/clients/` — extracting "everything" restores records + files;
the portal picks it up immediately, no restart.)

## Daily health check

`deploy/healthcheck.js` runs at **08:00 daily** (LaunchDaemon `com.sunwa.healthcheck`, plist in
`deploy/`). Checks: site via Cloudflare (`/healthz`), `www`, `/api/news` has items, form API returns
400 on bad input, all statusboard services up (`:8787/api/stats`), Gmail OAuth2 `verify()` (catches
refresh-token expiry), disk free > 10 GB. Every run logs one line to
`~/Library/Logs/sunwa-healthcheck.log`; it **emails `HEALTH_ALERT_EMAIL` only on failure**, plus an
all-OK summary on Mondays. Manual run: `node deploy/healthcheck.js` (add `--force-email` to test the
alert). External total-outage alerting is handled by Cloudflare notifications, not this script.

## Go-live status

**Cutover done 2026-07-13**: domain `sunwadesign.com` bought via Cloudflare Registrar; apex + `www` +
`test.` all routed to the tunnel; canonical/OG URLs + `sitemap.xml` + `robots.txt` updated.

Done since: reboot test passed 2026-07-13 (services start post-FileVault-unlock, no login);
Azure decommissioned 2026-07-16 (workflow + GitHub secrets removed, Web App deleted in portal).

> Gotcha: `cloudflared tunnel login`'s `cert.pem` is **zone-scoped** — after adding a new zone,
> re-login and pick it, or `tunnel route dns` writes records into the old zone.
