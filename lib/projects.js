'use strict';

// Danh sách dự án (/du-an + 3 thẻ ở trang chủ) — trước đây hardcode trong
// js/main.js, nay đọc từ JSON để thêm/xoá/sắp xếp được ngay trong /quan-tri.
//
// HAI file, cố ý:
//   data/projects.json     — bản gốc TRONG git, để clone mới chạy được ngay.
//   Private/projects.json  — bản đang dùng, NGOÀI git, panel quản trị ghi vào đây.
// Nếu để panel ghi thẳng vào file trong git thì cây làm việc bẩn và lệnh
// `git pull` của workflow deploy sẽ hỏng — nên bản sửa được phải nằm ngoài git.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SEED_JSON = path.join(ROOT, 'data', 'projects.json');
const LIVE_JSON = path.join(ROOT, 'Private', 'projects.json');

const YT_THUMB = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Cache theo mtime — sửa file bằng tay vẫn ăn ngay (giống lib/portal.js).
let cache = null;
let cacheKey = '';

function statKey() {
  for (const file of [LIVE_JSON, SEED_JSON]) {
    try {
      return file + ':' + fs.statSync(file).mtimeMs;
    } catch { /* thử file kế tiếp */ }
  }
  return 'none';
}

function readProjects() {
  const key = statKey();
  if (cache && key === cacheKey) return cache;
  let list = [];
  for (const file of [LIVE_JSON, SEED_JSON]) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(parsed)) { list = parsed; break; }
    } catch { /* thử file kế tiếp */ }
  }
  cache = list;
  cacheKey = key;
  return list;
}

// Ghi nguyên tử (giống lib/admin.js): file tạm rồi rename.
function writeProjects(list) {
  const tmp = LIVE_JSON + '.tmp';
  fs.mkdirSync(path.dirname(LIVE_JSON), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2) + '\n');
  fs.renameSync(tmp, LIVE_JSON);
  cache = null;
  cacheKey = '';
}

// Nhận mọi dạng link YouTube thường gặp — hoặc chính ID 11 ký tự.
// youtu.be/<id> · watch?v=<id> · /shorts/<id> · /embed/<id> · /live/<id>
function youtubeId(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (/^[\w-]{11}$/.test(raw)) return raw;
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/(?:shorts|embed|live|v)\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m) return m[1];
  }
  return null;
}

function clean(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, max || 200);
}

/* ---------- Public API ---------- */

function handlePublic(req, res) {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ ok: true, projects: readProjects() });
}

/* ---------- Admin API (đứng sau localOnly trong server.js) ---------- */

function handleAdminList(req, res) {
  res.json({ ok: true, projects: readProjects() });
}

function handleAdminCreate(req, res) {
  const body = req.body || {};
  const name = clean(body.name, 160);
  const location = clean(body.location, 160);
  const id = youtubeId(body.url);

  if (!id) return res.status(400).json({ ok: false, error: 'Link YouTube không hợp lệ.' });
  if (!name) return res.status(400).json({ ok: false, error: 'Vui lòng nhập tên dự án.' });

  const list = readProjects();
  if (list.some((p) => p.youtubeId === id)) {
    return res.status(400).json({ ok: false, error: 'Video này đã có trong danh sách.' });
  }

  const nextId = list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
  list.push({
    id: nextId,
    name,
    location,
    youtubeId: id,
    image: YT_THUMB(id),
    // Các trường số liệu để trống — thẻ và modal tự ẩn trường rỗng.
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  });
  writeProjects(list);
  res.json({ ok: true, projects: list });
}

function handleAdminDelete(req, res) {
  const id = Number(req.params.id);
  const list = readProjects();
  const next = list.filter((p) => Number(p.id) !== id);
  if (next.length === list.length) {
    return res.status(404).json({ ok: false, error: 'Không tìm thấy dự án.' });
  }
  writeProjects(next);
  res.json({ ok: true, projects: next });
}

// Đổi chỗ với hàng kề trên/dưới — nút ↑ ↓, không cần kéo thả.
function handleAdminMove(req, res) {
  const id = Number(req.params.id);
  const dir = (req.body || {}).dir;
  if (dir !== 'up' && dir !== 'down') {
    return res.status(400).json({ ok: false, error: 'Hướng di chuyển không hợp lệ.' });
  }
  const list = readProjects().slice();
  const i = list.findIndex((p) => Number(p.id) === id);
  if (i === -1) return res.status(404).json({ ok: false, error: 'Không tìm thấy dự án.' });

  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return res.json({ ok: true, projects: list }); // đã ở đầu/cuối
  [list[i], list[j]] = [list[j], list[i]];
  writeProjects(list);
  res.json({ ok: true, projects: list });
}

module.exports = {
  readProjects, writeProjects, youtubeId,
  handlePublic, handleAdminList, handleAdminCreate, handleAdminDelete, handleAdminMove,
};
