'use strict';

// Load .env if present (self-hosted Mac). No-op when the file doesn't exist
// (e.g. Azure, where config comes from App Service application settings).
require('dotenv').config();

const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
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
app.post('/api/submit', submitLimiter, async (req, res) => {
  const { status, body } = await handleSubmit(req.body || {});
  res.status(status).json(body);
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
