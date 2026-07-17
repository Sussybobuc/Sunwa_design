'use strict';

// Quản trị bảo hành — CHỈ chạy trên localhost (Mac Mini). Middleware localOnly
// trong server.js chặn mọi request qua tunnel/proxy (404). Không có mật khẩu:
// quyền truy cập = đang ngồi tại máy. Ghi trực tiếp Private/clients/ (ngoài git).

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { addMonths, warrantySummary } = require('./portal');

const CLIENTS_DIR = path.join(__dirname, '..', 'Private', 'clients');
const CLIENTS_JSON = path.join(CLIENTS_DIR, 'clients.json');

// Giữ đồng bộ với js/main.js + lib/mailer.js + lib/portal.js
const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;

// Request có phải phát sinh ngay trên máy này không? Socket phải là loopback
// VÀ không mang dấu vết proxy nào (mọi request qua Cloudflare tunnel đều có
// cf-ray/cf-connecting-ip/x-forwarded-for do edge gắn vào).
function isLocalRequest(req) {
  const addr = req.socket.remoteAddress || '';
  const loopback = addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
  const proxied = Boolean(
    req.headers['cf-ray'] || req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']
  );
  return loopback && !proxied;
}

function readClients() {
  try {
    return JSON.parse(fs.readFileSync(CLIENTS_JSON, 'utf8'));
  } catch {
    return {};
  }
}

// Ghi nguyên tử: viết file tạm rồi rename — không bao giờ để clients.json dở dang.
function writeClients(clients) {
  const tmp = CLIENTS_JSON + '.tmp';
  fs.mkdirSync(CLIENTS_DIR, { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(clients, null, 2) + '\n');
  fs.renameSync(tmp, CLIENTS_JSON);
}

// (addMonths / warrantySummary dùng chung từ lib/portal.js — một nguồn duy nhất)

// Cấu hình bảo hành tuỳ chỉnh từ panel: JSON (chuỗi hoặc object)
// { ketCau: false | {months: 1..1200}, chongTham: ..., hoanThien: ... }
// Trả { spec } (null nếu không gửi) hoặc { error }.
const WARRANTY_KEYS = ['ketCau', 'chongTham', 'hoanThien'];

function parseWarrantySpec(raw) {
  if (raw == null || raw === '') return { spec: null };
  let spec = raw;
  if (typeof raw === 'string') {
    try { spec = JSON.parse(raw); } catch { return { error: 'Cấu hình bảo hành không hợp lệ.' }; }
  }
  if (typeof spec !== 'object' || Array.isArray(spec)) return { error: 'Cấu hình bảo hành không hợp lệ.' };
  const out = {};
  for (const [key, v] of Object.entries(spec)) {
    if (!WARRANTY_KEYS.includes(key)) return { error: 'Cấu hình bảo hành không hợp lệ.' };
    if (v === false) { out[key] = false; continue; }
    const months = v && Number(v.months);
    if (!Number.isInteger(months) || months < 1 || months > 1200) {
      return { error: 'Thời hạn bảo hành phải từ 1 đến 1200 tháng.' };
    }
    out[key] = { months };
  }
  return { spec: out };
}

function nextCode(clients) {
  const year = new Date().getFullYear();
  let max = 0;
  for (const code of Object.keys(clients)) {
    const m = new RegExp(`^HD-${year}-(\\d+)$`).exec(code);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `HD-${year}-${String(max + 1).padStart(3, '0')}`;
}

function sanitizeFilename(name) {
  const base = path.basename(String(name || 'giay-bao-hanh'))
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // bỏ dấu tiếng Việt cho tên file an toàn
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'giay-bao-hanh';
}

// ---------- handlers (đều đứng sau localOnly trong server.js) ----------

function rowPayload(code, c) {
  return {
    code,
    name: c.name || '',
    phone: c.phone || '',
    project: c.project || '',
    handover: c.handover || null,
    hasCert: Boolean(c.baoHanh && c.baoHanh.file),
    docs: (c.docs || []).map((d) => ({ file: d.file, label: d.label || d.file })),
    logs: (c.logs || []).map((l) => ({ date: l.date || '', text: l.text || '' })),
    warranties: warrantySummary(c),
  };
}

function handleList(req, res) {
  const clients = readClients();
  const rows = Object.entries(clients).map(([code, c]) => rowPayload(code, c));
  // Mới nhất lên đầu (mã HD-YYYY-NNN tăng dần theo thời gian)
  rows.sort((a, b) => b.code.localeCompare(a.code));
  res.json({ ok: true, clients: rows });
}

// Ảnh tải lên được nén tự động: xoay đúng chiều (EXIF), tối đa 1600px,
// chuyển WebP ~82% — khách tải nhanh dù admin đưa ảnh chụp điện thoại 8–10 MB.
// PDF giữ nguyên. Trả về { buffer, filename }.
async function normalizeUpload(file) {
  if (file.mimetype === 'application/pdf') {
    return { buffer: file.buffer, filename: sanitizeFilename(file.originalname) };
  }
  const buffer = await sharp(file.buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const base = sanitizeFilename(file.originalname).replace(/\.[^.]+$/, '');
  return { buffer, filename: `${base}.webp` };
}

async function handleCreate(req, res) {
  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 120);
  const phone = String(body.phone || '').trim();
  const project = String(body.project || '').trim().slice(0, 200);
  const handover = String(body.handover || '').trim();
  const file = (req.files || [])[0];

  if (!name) return res.status(400).json({ ok: false, error: 'Vui lòng nhập tên khách hàng.' });
  if (!PHONE_REGEX.test(phone)) return res.status(400).json({ ok: false, error: 'Số điện thoại không hợp lệ.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(handover) || !addMonths(handover, 0)) {
    return res.status(400).json({ ok: false, error: 'Ngày bàn giao không hợp lệ (chọn từ lịch).' });
  }
  const warranty = parseWarrantySpec(body.warranty);
  if (warranty.error) return res.status(400).json({ ok: false, error: warranty.error });
  if (!file) return res.status(400).json({ ok: false, error: 'Vui lòng đính kèm giấy chứng nhận bảo hành (PDF hoặc ảnh).' });

  const clients = readClients();
  for (const [code, c] of Object.entries(clients)) {
    if (String(c.phone || '') === phone) {
      return res.status(400).json({ ok: false, error: `Số điện thoại này đã dùng cho hồ sơ ${code} (${c.name || 'không tên'}). Mỗi khách một số duy nhất.` });
    }
  }

  let upload;
  try {
    upload = await normalizeUpload(file);
  } catch {
    return res.status(400).json({ ok: false, error: 'Không đọc được tệp ảnh — vui lòng thử ảnh khác hoặc PDF.' });
  }

  const code = nextCode(clients);
  const dir = path.join(CLIENTS_DIR, code);
  const { buffer, filename } = upload;
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    clients[code] = {
      name,
      phone,
      project,
      handover,
      // Giấy chứng nhận bảo hành = CÔNG KHAI (hiện trên trang /bao-hanh).
      // docs = hồ sơ dự án RIÊNG TƯ (chỉ khách thấy sau khi đăng nhập /tra-cuu).
      baoHanh: { file: filename },
      docs: [],
      logs: [],
    };
    if (warranty.spec) clients[code].warranty = warranty.spec;
    writeClients(clients);
  } catch (err) {
    console.error('Admin create failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Không ghi được hồ sơ vào đĩa. Kiểm tra quyền thư mục Private/clients/.' });
  }

  res.json({ ok: true, client: rowPayload(code, clients[code]) });
}

// Sửa thông tin khách ngay trong danh sách (không đụng baoHanh/docs/logs).
function handleUpdate(req, res) {
  const code = String(req.params.code || '');
  const clients = readClients();
  const client = clients[code];
  if (!client) return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ này.' });

  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 120);
  const phone = String(body.phone || '').trim();
  const project = String(body.project || '').trim().slice(0, 200);
  const handover = String(body.handover || '').trim();

  if (!name) return res.status(400).json({ ok: false, error: 'Vui lòng nhập tên khách hàng.' });
  if (!PHONE_REGEX.test(phone)) return res.status(400).json({ ok: false, error: 'Số điện thoại không hợp lệ.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(handover) || !addMonths(handover, 0)) {
    return res.status(400).json({ ok: false, error: 'Ngày bàn giao không hợp lệ (chọn từ lịch).' });
  }
  for (const [otherCode, other] of Object.entries(clients)) {
    if (otherCode !== code && String(other.phone || '') === phone) {
      return res.status(400).json({ ok: false, error: `Số điện thoại này đã dùng cho hồ sơ ${otherCode} (${other.name || 'không tên'}).` });
    }
  }
  const warranty = parseWarrantySpec(body.warranty);
  if (warranty.error) return res.status(400).json({ ok: false, error: warranty.error });

  client.name = name;
  client.phone = phone;
  client.project = project;
  client.handover = handover;
  if (warranty.spec) client.warranty = warranty.spec;
  writeClients(clients);
  res.json({ ok: true, client: rowPayload(code, client) });
}

// Thêm một tài liệu "hồ sơ dự án" (riêng tư) cho khách đã có.
async function handleAddDoc(req, res) {
  const code = String(req.params.code || '');
  const clients = readClients();
  const client = clients[code];
  if (!client) return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ này.' });

  const file = (req.files || [])[0];
  if (!file) return res.status(400).json({ ok: false, error: 'Vui lòng chọn tệp (PDF hoặc ảnh).' });
  const label = String((req.body || {}).label || '').trim().slice(0, 120) ||
    sanitizeFilename(file.originalname);

  let upload;
  try {
    upload = await normalizeUpload(file);
  } catch {
    return res.status(400).json({ ok: false, error: 'Không đọc được tệp ảnh — vui lòng thử ảnh khác hoặc PDF.' });
  }

  // Tránh đè tệp trùng tên (kể cả giấy bảo hành công khai)
  let { buffer, filename } = upload;
  const dir = path.join(CLIENTS_DIR, code);
  if (fs.existsSync(path.join(dir, filename))) {
    filename = filename.replace(/(\.[^.]+)$/, `-${Date.now()}$1`);
  }

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    client.docs = client.docs || [];
    client.docs.push({ file: filename, label });
    writeClients(clients);
  } catch (err) {
    console.error('Admin add doc failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Không ghi được tệp vào đĩa.' });
  }
  res.json({ ok: true, client: rowPayload(code, client) });
}

// Gỡ một tài liệu hồ sơ dự án (tệp trên đĩa được giữ lại làm lưới an toàn).
function handleDeleteDoc(req, res) {
  const code = String(req.params.code || '');
  const fileName = String(req.params.file || '');
  const clients = readClients();
  const client = clients[code];
  if (!client) return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ này.' });
  const before = (client.docs || []).length;
  client.docs = (client.docs || []).filter((d) => d.file !== fileName);
  if (client.docs.length === before) {
    return res.status(404).json({ ok: false, error: 'Không tìm thấy tài liệu này.' });
  }
  writeClients(clients);
  res.json({ ok: true, client: rowPayload(code, client) });
}

function handleDelete(req, res) {
  const code = String(req.params.code || '');
  const clients = readClients();
  if (!clients[code]) return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ này.' });
  delete clients[code];
  writeClients(clients);
  // Thư mục Private/clients/<code>/ được GIỮ LẠI làm lưới an toàn — xoá tay nếu chắc chắn.
  res.json({ ok: true });
}

// Thêm một dòng nhật ký thi công (text đơn giản, ngày mặc định = hôm nay).
// Ảnh nhật ký (photos) vẫn thêm bằng cách sửa file như trước nếu cần.
function handleAddLog(req, res) {
  const code = String(req.params.code || '');
  const clients = readClients();
  const client = clients[code];
  if (!client) return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ này.' });

  const text = String((req.body || {}).text || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ ok: false, error: 'Vui lòng nhập nội dung nhật ký.' });
  let date = String((req.body || {}).date || '').trim();
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, error: 'Ngày không hợp lệ.' });
  }
  if (!date) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  client.logs = client.logs || [];
  client.logs.push({ date, text, photos: [] });
  writeClients(clients);
  res.json({ ok: true, client: rowPayload(code, client) });
}

// Gỡ dòng nhật ký theo vị trí trong mảng (index như admin đang hiển thị).
function handleDeleteLog(req, res) {
  const code = String(req.params.code || '');
  const idx = Number(req.params.index);
  const clients = readClients();
  const client = clients[code];
  if (!client) return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ này.' });
  if (!Number.isInteger(idx) || idx < 0 || idx >= (client.logs || []).length) {
    return res.status(404).json({ ok: false, error: 'Không tìm thấy dòng nhật ký này.' });
  }
  client.logs.splice(idx, 1);
  writeClients(clients);
  res.json({ ok: true, client: rowPayload(code, client) });
}

module.exports = {
  isLocalRequest, handleList, handleCreate, handleUpdate, handleDelete,
  handleAddDoc, handleDeleteDoc, handleAddLog, handleDeleteLog,
  normalizeUpload, // dùng chung với lib/payment.js (nén ảnh đính kèm đơn báo giá)
};
