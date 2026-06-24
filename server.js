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

// Static asset directories (only these dirs are public — not the repo root).
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Pretty URLs + their /<file>.html forms.
const PAGES = {
  '/': 'index',
  '/du-an': 'du-an',
  '/dich-vu': 'dich-vu',
  '/bao-gia': 'bao-gia',
  '/lien-he': 'lien-he',
};

Object.entries(PAGES).forEach(([route, file]) => {
  const send = (req, res) => res.sendFile(path.join(__dirname, file + '.html'));
  app.get(route, send);
  app.get('/' + file + '.html', send);
});

// 404 fallback — serve index.html (mirrors SWA navigationFallback).
app.use((req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Sunwa Design on ' + PORT));
