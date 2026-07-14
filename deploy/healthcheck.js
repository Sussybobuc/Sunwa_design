#!/usr/bin/env node
'use strict';

// Daily health check for the self-hosted Mac Mini (launchd: com.sunwa.healthcheck,
// 08:00 every day). Emails HEALTH_ALERT_EMAIL only on failure, plus a Monday
// all-OK summary. Run manually: node deploy/healthcheck.js [--force-email]

const path = require('path');
const fs = require('fs');
const os = require('os');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require(path.join(__dirname, '..', 'node_modules', 'nodemailer'));

const SITE = 'https://sunwadesign.com';
const TIMEOUT_MS = 10_000;
const MIN_FREE_DISK_GB = 10;
const LOG_FILE = path.join(os.homedir(), 'Library', 'Logs', 'sunwa-healthcheck.log');
const ALERT_EMAIL = process.env.HEALTH_ALERT_EMAIL;
const FORCE_EMAIL = process.argv.includes('--force-email');

function fetchWithTimeout(url, opts = {}) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

// Each check returns detail text; throws (or returns {fail}) on failure.
const CHECKS = [
  {
    name: 'Site qua Cloudflare (/healthz)',
    async run() {
      const res = await fetchWithTimeout(`${SITE}/healthz`);
      const body = await res.json();
      if (!res.ok || body.ok !== true) throw new Error(`HTTP ${res.status}`);
      return 'ok:true';
    },
  },
  {
    name: 'www.sunwadesign.com',
    async run() {
      const res = await fetchWithTimeout('https://www.sunwadesign.com/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return `HTTP ${res.status}`;
    },
  },
  {
    name: 'Tin tức (/api/news)',
    async run() {
      const res = await fetchWithTimeout(`${SITE}/api/news`);
      const body = await res.json();
      if (!body.ok || !Array.isArray(body.items) || body.items.length === 0) {
        throw new Error(`ok=${body.ok}, items=${body.items ? body.items.length : 'n/a'}`);
      }
      return `${body.items.length} bài`;
    },
  },
  {
    name: 'Form API (validation trả 400)',
    async run() {
      const res = await fetchWithTimeout(`${SITE}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (res.status !== 400) throw new Error(`HTTP ${res.status} (mong đợi 400)`);
      return 'HTTP 400 như mong đợi';
    },
  },
  {
    name: 'Dịch vụ local (statusboard :8787)',
    async run() {
      const res = await fetchWithTimeout('http://127.0.0.1:8787/api/stats');
      const body = await res.json();
      const services = body.services || [];
      if (services.length === 0) throw new Error('statusboard không trả danh sách dịch vụ');
      const down = services.filter((s) => !s.up).map((s) => s.name);
      if (down.length > 0) throw new Error(`DOWN: ${down.join(', ')}`);
      return `${services.length}/${services.length} online`;
    },
  },
  {
    name: 'Gmail OAuth2 (SMTP verify)',
    async run() {
      const transporter = buildTransport();
      if (!transporter) throw new Error('thiếu cấu hình SMTP trong .env');
      await transporter.verify();
      return 'đăng nhập SMTP OK';
    },
  },
  {
    name: `Dung lượng đĩa (>${MIN_FREE_DISK_GB} GB trống)`,
    async run() {
      const st = fs.statfsSync('/');
      const freeGb = (st.bavail * st.bsize) / 2 ** 30;
      if (freeGb < MIN_FREE_DISK_GB) throw new Error(`chỉ còn ${freeGb.toFixed(1)} GB`);
      return `${freeGb.toFixed(0)} GB trống`;
    },
  },
];

function buildTransport() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const clientId = process.env.OAUTH_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN;
  if (!user) return null;
  const auth = clientId && clientSecret && refreshToken
    ? { type: 'OAuth2', user, clientId, clientSecret, refreshToken }
    : process.env.SMTP_PASS ? { user, pass: process.env.SMTP_PASS } : null;
  if (!auth) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth,
  });
}

function log(line) {
  const stamp = new Date().toISOString();
  try {
    fs.appendFileSync(LOG_FILE, `${stamp} ${line}\n`);
  } catch { /* log dir missing — stdout still has it */ }
  console.log(line);
}

async function main() {
  const results = [];
  for (const check of CHECKS) {
    try {
      const detail = await check.run();
      results.push({ name: check.name, ok: true, detail });
    } catch (err) {
      results.push({ name: check.name, ok: false, detail: err.message });
    }
  }

  const failures = results.filter((r) => !r.ok);
  const lines = results.map((r) => `${r.ok ? '✓' : '✗'} ${r.name} — ${r.detail}`);
  const summary = failures.length === 0
    ? `PASS ${results.length}/${results.length}`
    : `FAIL ${failures.length}/${results.length}: ${failures.map((f) => f.name).join('; ')}`;
  log(`${summary} | ${lines.join(' | ')}`);

  const isMonday = new Date().getDay() === 1;
  const shouldEmail = FORCE_EMAIL || failures.length > 0 || isMonday;
  if (!shouldEmail) return;

  if (!ALERT_EMAIL) {
    log('HEALTH_ALERT_EMAIL chưa được cấu hình — không gửi được email cảnh báo.');
    process.exitCode = failures.length > 0 ? 1 : 0;
    return;
  }

  const subject = failures.length > 0
    ? `[Sunwa Mac] ✗ Health check FAILED — ${failures.length} vấn đề`
    : `[Sunwa Mac] ✓ Weekly health summary — all OK`;

  try {
    const transporter = buildTransport();
    await transporter.sendMail({
      from: `"Sunwa Mac Mini" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
      to: ALERT_EMAIL,
      subject,
      text: `Health check ${new Date().toLocaleString('vi-VN')} — ${summary}\n\n${lines.join('\n')}\n\nLog: ${LOG_FILE}`,
    });
    log(`Đã gửi email báo cáo tới ${ALERT_EMAIL}`);
  } catch (err) {
    log(`KHÔNG gửi được email cảnh báo: ${err.message}`);
  }
  process.exitCode = failures.length > 0 ? 1 : 0;
}

main();
