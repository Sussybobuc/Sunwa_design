# Self-hosting on the Mac Mini M4 — runbook

The site runs on a Mac Mini M4 (24 GB, macOS, `arm64`) at the office/home, replacing Azure App
Service. Azure stays live in parallel until the domain cutover, then gets decommissioned.

## Architecture

```
Internet → Cloudflare edge (TLS, DDoS) → outbound-only tunnel (cloudflared)
        → localhost:3000 (Express, pm2 "sunwa") → Gmail OAuth2 SMTP for the quote form
```

- **No inbound ports are open** on the router. `cloudflared` and Tailscale both connect outbound.
- Admin access from outside: **Tailscale** (SSH over the tailnet only — never port-forward SSH).

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

Tunnel: name `sunwa`, ID `7b911984-e908-4c24-81f5-ff17e0538223`. Ingress: `test.sunwadesign.vn`,
apex and `www` → `http://localhost:3000`, everything else → 404. (Hostnames pending domain purchase.)

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
(The Azure workflow also still runs until decommission.)

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

## Remaining before go-live (as of 2026-07-12)

1. **Buy the domain** (decision pending: `.vn` vs `.com` — `sunwadesign.com` was available) and add
   it to the Cloudflare account (nameservers → Cloudflare unless bought via Cloudflare Registrar).
2. Route DNS: `cloudflared tunnel route dns sunwa test.<domain>` → verify site end-to-end over HTTPS.
3. Cutover: route apex + `www`, update canonical/OG URLs in all HTML `<head>`s + `sitemap.xml`,
   update `CLAUDE.md` Deploy section and `docs/run-and-deploy.md`.
4. Reboot-without-login test (verify pm2 + tunnel daemons come up headless).
5. After ~1 week stable: delete the Azure Web App + remove `.github/workflows/main_sunwa-design.yml`.
```
