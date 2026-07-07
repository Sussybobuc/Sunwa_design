'use strict';

const path = require('path');
const express = require('express');
const { handleSubmit } = require('./lib/mailer');

const app = express();

app.use(express.json());

// Security headers on every response (reproduces the old staticwebapp.config.json globalHeaders).
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Form backend.
app.post('/api/submit', async (req, res) => {
  const { status, body } = await handleSubmit(req.body || {});
  res.status(status).json(body);
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
