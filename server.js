'use strict';

// Load .env if present (self-hosted Mac). No-op when the file doesn't exist
// (e.g. Azure, where config comes from App Service application settings).
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { handleSubmit } = require('./lib/mailer');
const portal = require('./lib/portal');

const app = express();

// Behind Cloudflare Tunnel the socket peer is always localhost; trust the
// first proxy hop so req.ip reflects the real client (X-Forwarded-For).
app.set('trust proxy', 1);

app.use(express.json());

// Security headers on every response (reproduces the old staticwebapp.config.json globalHeaders).
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Form backend. Rate-limited per IP so bots can't burn the Gmail send quota.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút hoặc gọi hotline 0916 557 558.',
  },
});
// Đính kèm hồ sơ lô đất: PDF/ảnh, ≤3 tệp, tổng ≤10 MB, giữ trong RAM rồi gắn
// thẳng vào email — không lưu xuống đĩa. Multer chỉ xử lý body multipart;
// request JSON thuần vẫn đi qua express.json() như cũ.
const MAX_TOTAL_UPLOAD = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TOTAL_UPLOAD, files: 3 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || /^image\//.test(file.mimetype);
    cb(ok ? null : new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), ok);
  },
});

app.post('/api/submit', submitLimiter, upload.array('files', 3), async (req, res) => {
  const files = req.files || [];
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_UPLOAD) {
    return res.status(400).json({ ok: false, error: 'Tệp đính kèm vượt quá 10 MB. Vui lòng gửi tệp nhỏ hơn.' });
  }
  const { status, body } = await handleSubmit(req.body || {}, files);
  res.status(status).json(body);
});

// Lỗi multer (quá dung lượng / sai loại tệp / quá số tệp) → 400 tiếng Việt
app.use('/api/submit', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const error = err.code === 'LIMIT_FILE_SIZE'
      ? 'Tệp đính kèm vượt quá 10 MB. Vui lòng gửi tệp nhỏ hơn.'
      : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Chỉ nhận tối đa 3 tệp PDF hoặc ảnh.'
        : 'Tệp đính kèm không hợp lệ.';
    return res.status(400).json({ ok: false, error });
  }
  next(err);
});

// Báo lỗi thi công (trang /bao-hanh) — SĐT đã đăng ký + mô tả (+ ảnh tuỳ chọn) → email.
const report = require('./lib/report');
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Bạn đã gửi quá nhiều báo lỗi. Vui lòng thử lại sau ít phút hoặc gọi hotline 0916 557 558.',
  },
});
app.post('/api/bao-loi', reportLimiter, upload.array('files', 3), async (req, res) => {
  const files = req.files || [];
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_UPLOAD) {
    return res.status(400).json({ ok: false, error: 'Tệp đính kèm vượt quá 10 MB. Vui lòng gửi tệp nhỏ hơn.' });
  }
  const { status, body } = await report.handleReport(req.body || {}, files);
  res.status(status).json(body);
});
app.use('/api/bao-loi', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const error = err.code === 'LIMIT_FILE_SIZE'
      ? 'Tệp đính kèm vượt quá 10 MB. Vui lòng gửi tệp nhỏ hơn.'
      : 'Chỉ nhận tối đa 3 tệp PDF hoặc ảnh.';
    return res.status(400).json({ ok: false, error });
  }
  next(err);
});

// Client portal (tra cứu hồ sơ) — see lib/portal.js. Login gets its own, stricter limiter.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút.',
  },
});
app.post('/api/tra-cuu/login', loginLimiter, portal.handleLogin);
app.get('/api/tra-cuu/me', portal.handleMe);
app.post('/api/tra-cuu/logout', portal.handleLogout);
app.get('/ho-so/:code/*', portal.handleFile);
// Giấy chứng nhận bảo hành công khai (gallery trên /bao-hanh)
app.get('/api/bao-hanh', portal.handleCertList);
app.get('/giay-bao-hanh/:code/:file', portal.handleCertFile);

// Quản trị bảo hành — CHỈ truy cập được từ chính Mac Mini (localhost, không qua
// tunnel). Mọi request khác nhận trang 404 y hệt đường dẫn không tồn tại, nên từ
// internet trang quản trị coi như không có. Xem lib/admin.js.
const admin = require('./lib/admin');
const localOnly = (req, res, next) => {
  if (admin.isLocalRequest(req)) return next();
  sendPage(res, '404', 404);
};
const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TOTAL_UPLOAD, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || /^image\//.test(file.mimetype);
    cb(ok ? null : new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), ok);
  },
});
app.get('/quan-tri', localOnly, (req, res) => sendPage(res, 'quan-tri'));
app.get('/quan-tri.html', localOnly, (req, res) => sendPage(res, 'quan-tri'));
app.get('/api/admin/clients', localOnly, admin.handleList);
app.post('/api/admin/clients', localOnly, adminUpload.array('file', 1), admin.handleCreate);
app.put('/api/admin/clients/:code', localOnly, admin.handleUpdate);
app.delete('/api/admin/clients/:code', localOnly, admin.handleDelete);
app.post('/api/admin/clients/:code/docs', localOnly, adminUpload.array('file', 1), admin.handleAddDoc);
app.delete('/api/admin/clients/:code/docs/:file', localOnly, admin.handleDeleteDoc);
app.post('/api/admin/clients/:code/logs', localOnly, admin.handleAddLog);
app.delete('/api/admin/clients/:code/logs/:index', localOnly, admin.handleDeleteLog);
app.use('/api/admin', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, error: 'Tệp không hợp lệ (PDF hoặc ảnh, tối đa 10 MB).' });
  }
  next(err);
});

// Báo giá Thi công (có phí) — thanh toán SePay, xem lib/payment.js + deploy/paid-quote-plan.md.
const payment = require('./lib/payment');
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Bạn đã tạo quá nhiều đơn. Vui lòng thử lại sau ít phút.' },
});
app.get('/api/thanh-toan/config', payment.handleConfig);
app.post('/api/bao-gia-thi-cong', orderLimiter, upload.array('files', 3), payment.handleCreateOrder);
app.get('/api/thanh-toan/trang-thai/:ma', payment.handleStatus);
app.post('/api/thanh-toan/webhook', payment.handleWebhook);
app.use('/api/bao-gia-thi-cong', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const error = err.code === 'LIMIT_FILE_SIZE'
      ? 'Tệp đính kèm vượt quá 10 MB. Vui lòng gửi tệp nhỏ hơn.'
      : 'Chỉ nhận tối đa 3 tệp PDF hoặc ảnh.';
    return res.status(400).json({ ok: false, error });
  }
  next(err);
});
app.get('/api/admin/orders', localOnly, payment.handleAdminList);
app.post('/api/admin/orders/:ma/mark-paid', localOnly, payment.handleAdminMarkPaid);

// Dự án (/du-an + 3 thẻ trang chủ) — thêm/xoá/sắp xếp trong /quan-tri, xem lib/projects.js.
const projects = require('./lib/projects');
app.get('/api/du-an', projects.handlePublic);
app.get('/api/admin/du-an', localOnly, projects.handleAdminList);
app.post('/api/admin/du-an', localOnly, projects.handleAdminCreate);
app.delete('/api/admin/du-an/:id', localOnly, projects.handleAdminDelete);
app.post('/api/admin/du-an/:id/move', localOnly, projects.handleAdminMove);

// News feed aggregation (tin-tuc page) — served from a 2h in-memory cache.
const { getNews } = require('./lib/news');
app.get('/api/news', async (req, res) => {
  const body = await getNews();
  res.set('Cache-Control', 'public, max-age=300');
  res.json(body);
});

// Banner tự thiết kế (Materials/banners/) — trả map <tên-không-đuôi> → URL kèm ?v=<mtime>
// để cache-bust: ghi đè file là khách thấy bản mới ngay, dù /materials cache 30 ngày.
const BANNER_EXTS = ['webp', 'avif', 'jpg', 'jpeg', 'png']; // thứ tự ưu tiên khi trùng tên
app.get('/api/banners', (req, res) => {
  const dir = path.join(__dirname, 'Materials', 'banners');
  const best = {};
  try {
    for (const file of fs.readdirSync(dir)) {
      const ext = path.extname(file).slice(1).toLowerCase();
      const rank = BANNER_EXTS.indexOf(ext);
      if (rank === -1) continue;
      const name = path.basename(file, path.extname(file));
      if (best[name] && best[name].rank <= rank) continue;
      const mtime = Math.floor(fs.statSync(path.join(dir, file)).mtimeMs / 1000);
      best[name] = { rank, url: `/materials/banners/${encodeURIComponent(file)}?v=${mtime}` };
    }
  } catch {
    // thư mục chưa tồn tại / không đọc được — trả map rỗng, trang giữ placeholder
  }
  const banners = {};
  for (const [name, b] of Object.entries(best)) banners[name] = b.url;
  res.set('Cache-Control', 'no-cache');
  res.json({ ok: true, banners });
});

// Health check (for Azure monitoring / uptime probes).
app.get('/healthz', (req, res) => res.json({ ok: true }));

// SEO files at the site root (can't live in a static subdir).
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));

// Static asset directories (only these dirs are public — not the repo root).
// URL có ?v= (do sendPage chèn) là bản đã đánh phiên bản → cache 1 năm thoải mái.
// URL trần (không ?v=) phải luôn tươi, vì tên file không băm nội dung.
const versionedStatic = (dir) => express.static(path.join(__dirname, dir), {
  setHeaders: (res, filePath, stat) => {
    const versioned = Boolean(res.req && res.req.query && res.req.query.v);
    res.set('Cache-Control', versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=0');
  },
});
app.use('/css', versionedStatic('css'));
app.use('/js', versionedStatic('js'));
app.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: '30d' }));
app.use('/materials', express.static(path.join(__dirname, 'Materials'), { maxAge: '30d' }));

// ---- Cache-bust CSS/JS -------------------------------------------------
// Chèn ?v=<mtime> vào /css/style.css và /js/main.js khi trả HTML, để sau mỗi lần
// deploy trình duyệt (và Cloudflare, vốn ép cache 4 giờ) lấy ngay bản mới —
// không cần hard-refresh hay purge. Tính MỘT LẦN lúc khởi động: workflow deploy
// kết thúc bằng `pm2 reload sunwa` nên tiến trình luôn khởi động lại sau khi build.
const mtimeMs = (rel) => {
  try { return fs.statSync(path.join(__dirname, rel)).mtimeMs; } catch { return 0; }
};
const ASSET_V = String(Math.round(Math.max(mtimeMs('css/style.css'), mtimeMs('js/main.js'))));

// Memo theo mtime của chính file HTML: mỗi file chỉ đọc + thay chuỗi 1 lần/deploy.
const pageCache = new Map();

function renderPage(file) {
  const abs = path.join(__dirname, file + '.html');
  const key = String(mtimeMs(file + '.html'));
  const hit = pageCache.get(file);
  if (hit && hit.key === key) return hit.html;
  const html = fs.readFileSync(abs, 'utf8')
    .split('/css/style.css').join('/css/style.css?v=' + ASSET_V)
    .split('/js/main.js').join('/js/main.js?v=' + ASSET_V);
  pageCache.set(file, { key, html });
  return html;
}

function sendPage(res, file, status) {
  res.status(status || 200).type('html').send(renderPage(file));
}

// Pretty URLs + their /<file>.html forms.
const PAGES = {
  '/': 'index',
  '/du-an': 'du-an',
  '/dich-vu': 'dich-vu',
  '/bao-gia': 'bao-gia',
  '/lien-he': 'lien-he',
  '/bao-hanh': 'bao-hanh',
  '/tin-tuc': 'tin-tuc',
  '/tra-cuu': 'tra-cuu', // trang tra cứu ẨN — chỉ tới qua QR trên giấy bảo hành
  // Section landing pages (placeholder)
  '/quan-ly-chat-luong': 'quan-ly-chat-luong',
  '/he-thong-phap-ly': 'he-thong-phap-ly',
};

Object.entries(PAGES).forEach(([route, file]) => {
  const send = (req, res) => sendPage(res, file);
  app.get(route, send);
  app.get('/' + file + '.html', send);
});

// Real 404 for unknown paths (pretty URLs are explicit routes above).
app.use((req, res) => {
  sendPage(res, '404', 404);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Sunwa Design on ' + PORT));
