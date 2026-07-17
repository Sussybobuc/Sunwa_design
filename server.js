'use strict';

// Load .env if present (self-hosted Mac). No-op when the file doesn't exist
// (e.g. Azure, where config comes from App Service application settings).
require('dotenv').config();

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
  res.status(404).sendFile(path.join(__dirname, '404.html'));
};
const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TOTAL_UPLOAD, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || /^image\//.test(file.mimetype);
    cb(ok ? null : new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), ok);
  },
});
app.get('/quan-tri', localOnly, (req, res) => res.sendFile(path.join(__dirname, 'quan-tri.html')));
app.get('/quan-tri.html', localOnly, (req, res) => res.sendFile(path.join(__dirname, 'quan-tri.html')));
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

// News feed aggregation (tin-tuc page) — served from a 2h in-memory cache.
const { getNews } = require('./lib/news');
app.get('/api/news', async (req, res) => {
  const body = await getNews();
  res.set('Cache-Control', 'public, max-age=300');
  res.json(body);
});

// Health check (for Azure monitoring / uptime probes).
app.get('/healthz', (req, res) => res.json({ ok: true }));

// SEO files at the site root (can't live in a static subdir).
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));

// Static asset directories (only these dirs are public — not the repo root).
// /css and /js are intentionally uncached: filenames aren't content-hashed, so a long
// cache would serve stale styles/scripts after a deploy.
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: '30d' }));
app.use('/materials', express.static(path.join(__dirname, 'Materials'), { maxAge: '30d' }));

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
  const send = (req, res) => res.sendFile(path.join(__dirname, file + '.html'));
  app.get(route, send);
  app.get('/' + file + '.html', send);
});

// Real 404 for unknown paths (pretty URLs are explicit routes above).
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Sunwa Design on ' + PORT));
