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
// Mặc định tính bằng THÁNG: kết cấu 10 năm · chống thấm 5 năm · hoàn thiện 1 năm.
const WARRANTY_DEFAULT_MONTHS = { ketCau: 120, chongTham: 60, hoanThien: 12 };

// ---------- warranty date math (dùng chung với lib/admin.js) ----------
// Luôn định dạng theo giờ ĐỊA PHƯƠNG — toISOString() đổi sang UTC làm lùi 1 ngày (VN = UTC+7).
function localISO(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return localISO(d);
}

// client.warranty (tuỳ chọn), mỗi hạng mục nhận một trong các dạng:
//   vắng mặt        → dùng mặc định
//   số (di sản)     → SỐ NĂM (bản ghi cũ vẫn đúng)
//   { months: N }   → thời hạn tuỳ chỉnh theo tháng (panel quản trị ghi dạng này)
//   false           → TẮT hạng mục đó (không hiện thanh ở đâu cả)
function tierMonths(client) {
  const spec = client.warranty || {};
  const out = {};
  for (const [key, defMonths] of Object.entries(WARRANTY_DEFAULT_MONTHS)) {
    const v = spec[key];
    if (v === false) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = Math.round(v * 12);
    else if (v && Number.isFinite(v.months)) out[key] = Math.round(v.months);
    else out[key] = defMonths;
  }
  return out;
}

function warrantySummary(client) {
  const handover = client.handover || null;
  const today = localISO(new Date());
  const out = {};
  for (const [key, months] of Object.entries(tierMonths(client))) {
    const until = handover ? addMonths(handover, months) : null;
    out[key] = { months, until, active: until ? until >= today : null };
  }
  return out;
}

function clientPayload(code, client) {
  const enc = encodeURIComponent(code);
  return {
    ok: true,
    code,
    name: client.name || '',
    project: client.project || '',
    handover: client.handover || null,
    warranty: warrantySummary(client),
    docs: (client.docs || []).map((d) => ({
      label: d.label || d.file,
      url: `/ho-so/${enc}/${encodeURIComponent(d.file)}`,
      // Cho phép dashboard nhúng xem trước đúng kiểu tệp
      kind: /\.(webp|jpe?g|png|gif|avif)$/i.test(d.file) ? 'image'
          : /\.pdf$/i.test(d.file) ? 'pdf' : 'file',
    })),
    logs: (client.logs || []).map((l) => ({
      date: l.date || '',
      text: l.text || '',
      photos: (l.photos || []).map((p) => `/ho-so/${enc}/${p.split('/').map(encodeURIComponent).join('/')}`),
    })),
  };
}

// ---------- tra khách theo SĐT đã đăng ký (dùng chung cho login + báo lỗi) ----------
// Quét TẤT CẢ mục (không dừng sớm) để thời gian phản hồi không lộ khách nào tồn tại.
// Trả { code, client } hoặc null.
function findClientByPhone(phone) {
  const p = String(phone || '').trim();
  if (!PHONE_REGEX.test(p)) return null;
  const clients = loadClients();
  let found = null;
  for (const [code, client] of Object.entries(clients)) {
    if (timingEqual(p, String(client.phone || '')) && !found) found = { code, client };
  }
  return found;
}

// ---------- handlers ----------
function handleLogin(req, res) {
  if (!secret()) {
    console.error('SESSION_SECRET is not set — portal login disabled.');
    return res.status(500).json({ ok: false, error: 'Hệ thống tra cứu chưa được cấu hình. Vui lòng gọi hotline 0916 557 558.' });
  }
  const phone = String((req.body || {}).phone || '').trim();
  const fail = () =>
    res.status(401).json({ ok: false, error: 'Số điện thoại chưa được đăng ký. Vui lòng gọi hotline 0916 557 558 nếu cần hỗ trợ.' });

  // Đăng nhập chỉ bằng SĐT → tìm khách theo số (mỗi khách một số duy nhất).
  const found = findClientByPhone(phone);
  if (!found) return fail();

  res.set('Set-Cookie', cookieHeader(makeCookie(found.code), SESSION_HOURS * 3600, req));
  res.json(clientPayload(found.code, found.client));
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

// ---------- giấy chứng nhận bảo hành CÔNG KHAI (trang /bao-hanh) ----------
// Mỗi khách có thể có một giấy bảo hành công khai (client.baoHanh.file, do
// trang quản trị tải lên). Danh sách này hiện cho MỌI người xem — kể cả giấy
// đã hết hạn (minh chứng các công trình đã bàn giao). Hồ sơ dự án (docs/logs)
// vẫn riêng tư sau đăng nhập.

function certKind(file) {
  return /\.pdf$/i.test(file) ? 'pdf' : 'image';
}

// GET /api/bao-hanh — công khai, không cần đăng nhập.
function handleCertList(req, res) {
  const clients = loadClients();
  const certs = Object.entries(clients)
    .filter(([, c]) => c.baoHanh && c.baoHanh.file)
    .map(([code, c]) => ({
      name: c.name || '',
      project: c.project || '',
      handover: c.handover || null,
      url: `/giay-bao-hanh/${encodeURIComponent(code)}/${encodeURIComponent(c.baoHanh.file)}`,
      kind: certKind(c.baoHanh.file),
      warranties: warrantySummary(c),
    }))
    .sort((a, b) => String(b.handover || '').localeCompare(String(a.handover || '')));
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ ok: true, certs });
}

// GET /giay-bao-hanh/<code>/<file> — công khai nhưng CHỈ trả đúng tệp giấy
// bảo hành đã đăng ký của khách đó; mọi tên tệp khác trong thư mục → 404
// (hồ sơ dự án riêng tư vẫn phải qua /ho-so + cookie).
function handleCertFile(req, res) {
  const clients = loadClients();
  const client = clients[req.params.code];
  const registered = client && client.baoHanh && client.baoHanh.file;
  if (!registered || req.params.file !== registered) return res.status(404).end();
  res.set('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(CLIENTS_DIR, req.params.code, registered), (err) => {
    if (err && !res.headersSent) res.status(404).end();
  });
}

module.exports = {
  handleLogin, handleMe, handleLogout, handleFile, handleCertList, handleCertFile,
  addMonths, warrantySummary, findClientByPhone,
};
