'use strict';

// Client portal (tra cứu hồ sơ) — contract-code + phone login over a stateless
// HMAC-signed cookie. Data lives in Private/clients/ (git-ignored, on-disk only):
//   Private/clients/clients.json          — all client metadata (see deploy/client-portal.md)
//   Private/clients/<code>/...            — that client's files (docs, log photos)

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CLIENTS_DIR = path.join(__dirname, '..', 'Private', 'clients');
const CLIENTS_JSON = path.join(CLIENTS_DIR, 'clients.json');
const COOKIE_NAME = 'sunwa_client';
const SESSION_HOURS = 24;

// Same VN phone shape as the quote form (keep in sync with js/main.js and lib/mailer.js).
const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;

function secret() {
  return process.env.SESSION_SECRET || '';
}

// ---------- clients.json, cached by mtime so staff edits apply without restart ----------
let cache = { mtimeMs: 0, data: null };

function loadClients() {
  let stat;
  try {
    stat = fs.statSync(CLIENTS_JSON);
  } catch {
    return {};
  }
  if (!cache.data || stat.mtimeMs !== cache.mtimeMs) {
    try {
      cache = { mtimeMs: stat.mtimeMs, data: JSON.parse(fs.readFileSync(CLIENTS_JSON, 'utf8')) };
    } catch (err) {
      console.error('clients.json is unreadable or invalid JSON:', err.message);
      return cache.data || {};
    }
  }
  return cache.data;
}

// ---------- signed-cookie session ----------
function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function timingEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function makeCookie(code) {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = `${Buffer.from(code).toString('base64url')}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

// Returns the contract code, or null if missing/invalid/expired.
function readSession(req) {
  if (!secret()) return null;
  const header = req.headers.cookie || '';
  let raw = null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE_NAME) raw = v.join('=');
  }
  if (!raw) return null;
  const pieces = raw.split('.');
  if (pieces.length !== 3) return null;
  const [codeB64, expires, mac] = pieces;
  if (!timingEqual(mac, sign(`${codeB64}.${expires}`))) return null;
  if (Number(expires) < Date.now()) return null;
  try {
    return Buffer.from(codeB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function cookieHeader(value, maxAgeSeconds, req) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

// ---------- payload shaping (never expose the phone back out) ----------
const WARRANTY_DEFAULTS = { ketCau: 5, chongTham: 3, hoanThien: 1 };

function clientPayload(code, client) {
  const enc = encodeURIComponent(code);
  return {
    ok: true,
    code,
    name: client.name || '',
    project: client.project || '',
    handover: client.handover || null,
    warranty: Object.assign({}, WARRANTY_DEFAULTS, client.warranty || {}),
    docs: (client.docs || []).map((d) => ({
      label: d.label || d.file,
      url: `/ho-so/${enc}/${encodeURIComponent(d.file)}`,
    })),
    logs: (client.logs || []).map((l) => ({
      date: l.date || '',
      text: l.text || '',
      photos: (l.photos || []).map((p) => `/ho-so/${enc}/${p.split('/').map(encodeURIComponent).join('/')}`),
    })),
  };
}

// ---------- handlers ----------
function handleLogin(req, res) {
  if (!secret()) {
    console.error('SESSION_SECRET is not set — portal login disabled.');
    return res.status(500).json({ ok: false, error: 'Hệ thống tra cứu chưa được cấu hình. Vui lòng gọi hotline 0916 557 558.' });
  }
  const code = String((req.body || {}).code || '').trim().toUpperCase();
  const phone = String((req.body || {}).phone || '').trim();
  const fail = () =>
    res.status(401).json({ ok: false, error: 'Mã hợp đồng hoặc số điện thoại không đúng.' });

  if (!code || code.length > 40 || !PHONE_REGEX.test(phone)) return fail();
  const client = loadClients()[code];
  if (!client || !timingEqual(phone, String(client.phone || ''))) return fail();

  res.set('Set-Cookie', cookieHeader(makeCookie(code), SESSION_HOURS * 3600, req));
  res.json(clientPayload(code, client));
}

function handleMe(req, res) {
  const code = readSession(req);
  const client = code ? loadClients()[code] : null;
  if (!client) return res.status(401).json({ ok: false });
  res.json(clientPayload(code, client));
}

function handleLogout(req, res) {
  res.set('Set-Cookie', cookieHeader('', 0, req));
  res.json({ ok: true });
}

// GET /ho-so/<code>/<file...> — authenticated download from that client's folder only.
function handleFile(req, res) {
  const sessionCode = readSession(req);
  if (!sessionCode) return res.status(401).send('Vui lòng đăng nhập để xem hồ sơ.');
  const urlCode = req.params.code;
  if (!timingEqual(sessionCode, urlCode)) return res.status(403).send('Không có quyền truy cập hồ sơ này.');

  const base = path.join(CLIENTS_DIR, sessionCode) + path.sep;
  const target = path.normalize(path.join(base, req.params[0] || ''));
  if (!target.startsWith(base)) return res.status(404).end();

  res.set('Cache-Control', 'private, no-store');
  res.sendFile(target, (err) => {
    if (err && !res.headersSent) res.status(404).send('Không tìm thấy tệp.');
  });
}

module.exports = { handleLogin, handleMe, handleLogout, handleFile };
