'use strict';

// Tin tức: fetch + cache Vietnamese newspaper RSS feeds (BĐS/xây dựng).
// We aggregate headlines/snippets with attribution and link out to the
// original articles — full text is never republished.

const Parser = require('rss-parser');

const FEEDS = [
  { source: 'VnExpress', url: 'https://vnexpress.net/rss/bat-dong-san.rss' },
  { source: 'Dân Trí', url: 'https://dantri.com.vn/rss/bat-dong-san.rss' },
];

const TTL_MS = 2 * 60 * 60 * 1000; // 2h — plenty fresh, polite to the sources
const FETCH_TIMEOUT_MS = 8000;
const MAX_ITEMS = 30;
const SNIPPET_LEN = 200;

const parser = new Parser({ timeout: FETCH_TIMEOUT_MS });

let cache = { fetchedAt: 0, items: [] };
let refreshing = null; // in-flight refresh promise (dedupes concurrent expiries)

function firstImgSrc(html) {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || '');
  return m ? m[1] : '';
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeed(feed) {
  const parsed = await parser.parseURL(feed.url);
  return (parsed.items || []).map((it) => {
    const desc = it.content || it.description || '';
    const snippet = stripHtml(desc);
    return {
      source: feed.source,
      title: (it.title || '').trim(),
      link: it.link || '',
      date: it.pubDate ? new Date(it.pubDate).toISOString() : null,
      snippet: snippet.length > SNIPPET_LEN ? snippet.slice(0, SNIPPET_LEN).trimEnd() + '…' : snippet,
      thumb: firstImgSrc(desc),
    };
  }).filter((it) => it.title && it.link);
}

async function refresh() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const items = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, MAX_ITEMS);

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`News feed failed (${FEEDS[i].source}):`, r.reason && r.reason.message);
    }
  });

  // Keep the stale cache if every feed failed — a newspaper hiccup must
  // never blank the page.
  if (items.length > 0) {
    cache = { fetchedAt: Date.now(), items };
  } else if (cache.items.length === 0) {
    cache = { fetchedAt: Date.now(), items: [] }; // nothing to serve; retry after TTL
  }
}

async function getNews() {
  if (Date.now() - cache.fetchedAt > TTL_MS) {
    if (!refreshing) {
      refreshing = refresh().finally(() => { refreshing = null; });
    }
    // First-ever call blocks (nothing to serve yet); later expiries serve
    // stale data immediately while the refresh runs in the background.
    if (cache.items.length === 0) await refreshing;
  }
  return { ok: true, fetchedAt: cache.fetchedAt, items: cache.items };
}

module.exports = { getNews };
