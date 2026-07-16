'use strict';

// Quản trị bảo hành — CHỈ chạy trên localhost (Mac Mini). Middleware localOnly
// trong server.js chặn mọi request qua tunnel/proxy (404). Không có mật khẩu:
// quyền truy cập = đang ngồi tại máy. Ghi trực tiếp Private/clients/ (ngoài git).

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CLIENTS_DIR = path.join(__dirname, '..', 'Private', 'clients');
const CLIENTS_JSON = path.join(CLIENTS_DIR, 'clients.json');

// Giữ đồng bộ với js/main.js + lib/mailer.js + lib/portal.js
const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;
const WARRANTY_YEARS = { ketCau: 5, chongTham: 3, hoanThien: 1 };

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

function addYears(dateStr, years) {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + years);
  // Định dạng theo giờ ĐỊA PHƯƠNG — toISOString() đổi sang UTC làm lùi 1 ngày (VN = UTC+7)
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function warrantySummary(client) {
  const handover = client.handover || null;
  const years = Object.assign({}, WARRANTY_YEARS, client.warranty || {});
  const out = {};
  for (const [key, y] of Object.entries(years)) {
    const until = handover ? addYears(handover, y) : null;
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    out[key] = { years: y, until, active: until ? until >= today : null };
  }
  return out;
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

function handleList(req, res) {
  const clients = readClients();
  const rows = Object.entries(clients).map(([code, c]) => ({
    code,
    name: c.name || '',
    phone: c.phone || '',
    project: c.project || '',
    handover: c.handover || null,
    docsCount: (c.docs || []).length,
    logsCount: (c.logs || []).length,
    warranties: warrantySummary(c),
  }));
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(handover) || !addYears(handover, 0)) {
    return res.status(400).json({ ok: false, error: 'Ngày bàn giao không hợp lệ (chọn từ lịch).' });
  }
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
      docs: [{ file: filename, label: 'Giấy chứng nhận bảo hành' }],
      logs: [],
    };
    writeClients(clients);
  } catch (err) {
    console.error('Admin create failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Không ghi được hồ sơ vào đĩa. Kiểm tra quyền thư mục Private/clients/.' });
  }

  res.json({
    ok: true,
    client: { code, name, phone, project, handover, docsCount: 1, logsCount: 0, warranties: warrantySummary(clients[code]) },
  });
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

module.exports = { isLocalRequest, handleList, handleCreate, handleDelete };
