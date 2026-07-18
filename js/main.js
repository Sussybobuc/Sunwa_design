'use strict';

/* ============================================================
   DATA — 21 công trình thực tế (video trên kênh YouTube của Sunwa,
   thứ tự = thứ tự đăng). Thẻ hiển thị thumbnail YouTube + huy hiệu Play;
   bấm thẻ → mở modal chi tiết và video phát TO trong modal
   (youtube-nocookie, chỉ tải khi mở) — trang luôn nhẹ.
   Cách cập nhật — chỉ cần sửa mảng này, không đụng chỗ khác:
   - name/location: hiện trên thẻ + modal chi tiết.
   - typeLabel/area/cost/duration/description: đang để trống, điền dần
     khi có số liệu — thẻ và modal tự ẩn các trường trống.
   - youtubeId: ID video (phần sau "v=" hoặc "youtu.be/" trong URL);
     image: thumbnail YouTube của chính video đó (i.ytimg.com).
   ============================================================ */
const PROJECTS = [
  {
    id: 1,
    name: 'Vỹ HOUSE Cẩm Lệ',
    location: 'Cẩm Lệ, Đà Nẵng',
    youtubeId: '1J7vnAMqagU',
    image: 'https://i.ytimg.com/vi/1J7vnAMqagU/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 2,
    name: 'Bình HOUSE Sơn Trà',
    location: 'Sơn Trà, Đà Nẵng',
    youtubeId: 'LlCo5vPOFw0',
    image: 'https://i.ytimg.com/vi/LlCo5vPOFw0/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 3,
    name: 'MS Thu Ngũ Hành Sơn',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    youtubeId: 'cjbbqwBTCI0',
    image: 'https://i.ytimg.com/vi/cjbbqwBTCI0/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 4,
    name: 'MS HOA Ngũ Hành Sơn',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    youtubeId: 'Zbl7Rj70bAA',
    image: 'https://i.ytimg.com/vi/Zbl7Rj70bAA/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 5,
    name: 'Villa CHÂU THẠNH Cẩm Lệ',
    location: 'Cẩm Lệ, Đà Nẵng',
    youtubeId: '4EduK8Jl9zY',
    image: 'https://i.ytimg.com/vi/4EduK8Jl9zY/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 6,
    name: 'Villa QUÝ HÀ Hòa Xuân',
    location: 'Hòa Xuân, Đà Nẵng',
    youtubeId: 'gCk1mE6lrBE',
    image: 'https://i.ytimg.com/vi/gCk1mE6lrBE/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 7,
    name: 'Mr Truyền Sơn Trà',
    location: 'Sơn Trà, Đà Nẵng',
    youtubeId: 'xu06CrwjZ1U',
    image: 'https://i.ytimg.com/vi/xu06CrwjZ1U/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 8,
    name: 'ANH THƯ Villa Ngũ Hành Sơn',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    youtubeId: 'R9y4x-HwbPM',
    image: 'https://i.ytimg.com/vi/R9y4x-HwbPM/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 9,
    name: 'Hiền Villa Hòa Xuân',
    location: 'Hòa Xuân, Đà Nẵng',
    youtubeId: 'A8Mx8C1FgBg',
    image: 'https://i.ytimg.com/vi/A8Mx8C1FgBg/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 10,
    name: 'Shop ME&BE Đà Nẵng',
    location: 'Đà Nẵng',
    youtubeId: 'jlZF6C9FJzk',
    image: 'https://i.ytimg.com/vi/jlZF6C9FJzk/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 11,
    name: 'Nhà ở Quê Điện Tiến',
    location: 'Điện Tiến, Quảng Nam',
    youtubeId: 'i34Ec9STXrg',
    image: 'https://i.ytimg.com/vi/i34Ec9STXrg/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 12,
    name: 'Dự Án Quy Nhơn',
    location: 'Quy Nhơn',
    youtubeId: 'patqYg09Dz0',
    image: 'https://i.ytimg.com/vi/patqYg09Dz0/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 13,
    name: 'Huyện Ủy Hòa Vang',
    location: 'Hòa Vang, Đà Nẵng',
    youtubeId: 'XLcdn4L_EOg',
    image: 'https://i.ytimg.com/vi/XLcdn4L_EOg/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 14,
    name: 'Nhà hàng Tiệc Cưới QUY NHƠN',
    location: 'Quy Nhơn',
    youtubeId: '7jllfCQN3S0',
    image: 'https://i.ytimg.com/vi/7jllfCQN3S0/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 15,
    name: 'KS MERIA QUY NHƠN',
    location: 'Quy Nhơn',
    youtubeId: 'sXw9MkffAyQ',
    image: 'https://i.ytimg.com/vi/sXw9MkffAyQ/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 16,
    name: 'Nhà thờ Hà Thanh ĐIỆN BÀN',
    location: 'Điện Bàn, Quảng Nam',
    youtubeId: 'FNPIV7MQtfU',
    image: 'https://i.ytimg.com/vi/FNPIV7MQtfU/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 17,
    name: 'Chùa AN LONG QUY NHƠN',
    location: 'Quy Nhơn',
    youtubeId: 'tvjAHtp1zHw',
    image: 'https://i.ytimg.com/vi/tvjAHtp1zHw/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 18,
    name: 'Di Tich Đồi Trung Sơn Hòa Liên',
    location: 'Hòa Liên, Đà Nẵng',
    youtubeId: 'U8hv7I3XRL8',
    image: 'https://i.ytimg.com/vi/U8hv7I3XRL8/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 19,
    name: 'Đài Liệt Sĩ Hòa Vang',
    location: 'Hòa Vang, Đà Nẵng',
    youtubeId: '6IGLrQ4K56E',
    image: 'https://i.ytimg.com/vi/6IGLrQ4K56E/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 20,
    name: 'Trụ sở LĐLĐ Đà Nẵng',
    location: 'Đà Nẵng',
    youtubeId: 'KIAVZn_IQHQ',
    image: 'https://i.ytimg.com/vi/KIAVZn_IQHQ/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
  {
    id: 21,
    name: 'Dương Bình House - Hội An, Đà Nẵng',
    location: 'Hội An',
    youtubeId: 'V82ZtpQor7o',
    image: 'https://i.ytimg.com/vi/V82ZtpQor7o/hqdefault.jpg',
    type: '', typeLabel: '', area: '', cost: '', duration: '', year: '', query: '', description: '',
  },
];

/* Đơn giá tham khảo (VNĐ/m²) cho calculator */
const PRICE_PER_M2 = {
  'nha-pho': { min: 5500000, max: 8000000 },
  'biet-thu': { min: 8000000, max: 14000000 },
  'nha-cap-4': { min: 3500000, max: 5500000 },
  'cai-tao': { min: 2000000, max: 4500000 },
};

/* ============================================================
   HELPERS
   ============================================================ */
function imageUrl(query, id, size) {
  const dim = size || '800x600';
  return `https://source.unsplash.com/${dim}/?${encodeURIComponent(query)}&sig=${id}`;
}

/* Định dạng tiền Việt: >= 1 tỷ → "X,X tỷ", còn lại → "XXX triệu" */
function formatVND(amount) {
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000;
    const rounded = Math.round(ty * 10) / 10;
    return `${rounded.toLocaleString('vi-VN')} tỷ`;
  }
  const trieu = Math.round(amount / 1_000_000);
  return `${trieu.toLocaleString('vi-VN')} triệu`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   1. NAVBAR MOBILE TOGGLE
   ============================================================ */
function initNavToggle() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  const ICON_HAMBURGER = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`;
  const ICON_X = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

  // Gỡ hidden — CSS media query kiểm soát hiển thị trên mobile
  menu.classList.remove('hidden');

  // Lớp phủ mờ (dim) — chèn một lần; bấm vào để đóng drawer
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  const close = () => {
    menu.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = ICON_HAMBURGER;
  };
  const open = () => {
    menu.classList.add('is-open');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // khoá cuộn nền khi drawer mở
    toggle.setAttribute('aria-expanded', 'true');
    toggle.innerHTML = ICON_X;
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  });

  // Bấm vào lớp phủ mờ → đóng
  backdrop.addEventListener('click', close);

  // Đóng khi click một link trong menu (nút dropdown toggle là <button> → KHÔNG đóng, để mở accordion)
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

  // Đóng khi nhấn Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Reset khi chuyển sang desktop (xoá trạng thái drawer/dim/khoá cuộn)
  // Navbar đầy đủ chỉ hiện từ lg (1024px) — tablet dùng drawer như mobile.
  const mqDesktop = window.matchMedia('(min-width: 1024px)');
  mqDesktop.addEventListener('change', (e) => {
    if (e.matches) close();
  });
}

/* ============================================================
   2. SMOOTH SCROLL CHO ANCHOR LINKS
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ============================================================
   3. RENDER PROJECT CARDS
   ============================================================ */
/* Khu media (hero) của thẻ dự án: luôn hiển thị ẢNH (image thật > Unsplash tạm >
   ô trống). Có youtubeId → chồng nút Play; iframe YouTube chỉ tải khi bấm. */
function projectMediaHtml(p) {
  const src = p.image || (p.query ? imageUrl(p.query, p.id) : '');
  const picture = src
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.name || 'Dự án Sunwa')}" loading="lazy" decoding="async"
             class="h-full w-full object-cover transition duration-normal group-hover:scale-105">`
    : `<div class="pmedia-empty">
         <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5L9 20"/></svg>
         <span>Hình ảnh đang cập nhật</span>
       </div>`;
  // Huy hiệu Play thuần trang trí — bấm ở ĐÂU trên thẻ cũng mở modal và video
  // phát to trong đó (không phát nhỏ trong thẻ nữa). pointer-events:none để
  // click xuyên qua huy hiệu rơi vào thẻ.
  const play = p.youtubeId
    ? `<span class="pmedia-play" style="pointer-events:none" aria-hidden="true">
         <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z"/></svg>
       </span>`
    : '';
  return `
      <div class="relative aspect-[4/3] overflow-hidden bg-bg-dark" data-media>
        ${p.typeLabel ? `<span class="project-tag">${escapeHtml(p.typeLabel)}</span>` : ''}
        ${picture}${play}
      </div>`;
}

function projectCardHtml(p) {
  // Ô trống (chưa điền name): thẻ "đang cập nhật" — không mở modal chi tiết.
  if (!p.name) {
    return `
    <article class="project-card is-placeholder fade-in" data-type="${p.type}" data-id="${p.id}">
      ${projectMediaHtml(p)}
      <div class="p-4">
        <h3 class="text-lg font-medium text-text-light">Dự án đang được cập nhật</h3>
        <p class="mt-1 text-base text-text-light">Thông tin công trình sẽ sớm có mặt tại đây.</p>
      </div>
    </article>`;
  }
  return `
    <article class="project-card group fade-in" data-type="${p.type}" data-id="${p.id}" tabindex="0" role="button"
             aria-label="Xem chi tiết ${escapeHtml(p.name)}">
      ${projectMediaHtml(p)}
      <div class="p-4">
        <h3 class="text-lg font-medium text-text">${escapeHtml(p.name)}</h3>
        ${(() => {
          const meta = [p.typeLabel, p.area, p.cost, p.duration, p.location].filter(Boolean).join(' · ');
          return meta ? `<p class="mt-1 text-base text-text-muted">${escapeHtml(meta)}</p>` : '';
        })()}
      </div>
    </article>`;
}


function renderProjects() {
  const preview = document.getElementById('projects-preview');
  const grid = document.getElementById('projects-grid');

  if (preview) {
    preview.innerHTML = PROJECTS.slice(0, 3).map(projectCardHtml).join('');
  }
  if (grid) {
    grid.innerHTML = PROJECTS.map(projectCardHtml).join('');
  }
}


/* ============================================================
   5. LIGHTBOX MODAL CHI TIẾT DỰ ÁN
   ============================================================ */
let modalEl = null;
let lastFocused = null;

function buildModal() {
  modalEl = document.createElement('div');
  modalEl.id = 'project-modal';
  modalEl.className =
    'fixed inset-0 z-[500] hidden items-center justify-center bg-black/70 p-4';
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');
  modalEl.innerHTML = `
    <div class="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-bg" data-modal-content>
      <button type="button" data-modal-close aria-label="Đóng"
              class="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-bg-dark/70 text-white hover:bg-bg-dark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div data-modal-body></div>
    </div>`;
  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl || e.target.closest('[data-modal-close]')) {
      closeModal();
    }
  });

  // Esc xử lý tập trung ở đây — dùng chung cho mọi modal trên tất cả 5 trang
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) closeModal();
  });
}

function openModal(project) {
  if (!modalEl) buildModal();
  const body = modalEl.querySelector('[data-modal-body]');
  // Có video → phát ngay trong modal (khách vừa bấm thẻ nên autoplay hợp lý);
  // iframe bị xoá khi đóng modal (closeModal) nên video không kêu ngầm.
  const media = project.youtubeId
    ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(project.youtubeId)}?autoplay=1"
               title="${escapeHtml(project.name)}" allowfullscreen
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               class="h-full w-full border-0"></iframe>`
    : `<img src="${escapeHtml(project.image || imageUrl(project.query, project.id, '1200x675'))}" alt="${escapeHtml(project.name)}"
           loading="lazy" class="h-full w-full object-cover">`;
  body.innerHTML = `
    <div class="aspect-[16/9] w-full overflow-hidden rounded-t-lg bg-bg-dark">
      ${media}
    </div>
    <div class="p-6">
      ${project.typeLabel ? `<span class="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">${escapeHtml(project.typeLabel)}</span>` : ''}
      <h3 class="mt-3 text-2xl font-semibold text-text">${escapeHtml(project.name)}</h3>
      <dl class="mt-4 grid grid-cols-2 gap-3 text-base">
        ${[
          ['Địa điểm', project.location],
          ['Diện tích', project.area],
          ['Tổng đầu tư', project.cost],
          ['Thời gian thi công', project.duration],
        ].filter(([, v]) => v)
         .map(([label, v]) => `<div><dt class="text-text-muted">${label}</dt><dd class="font-medium">${escapeHtml(v)}</dd></div>`)
         .join('')}
      </dl>
      ${project.description ? `<p class="mt-4 text-md leading-relaxed text-text-muted">${escapeHtml(project.description)}</p>` : ''}
      <a href="/bao-gia.html" class="btn-primary mt-6">Nhận báo giá tương tự →</a>
    </div>`;

  lastFocused = document.activeElement;
  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');
  void modalEl.offsetWidth; // reflow để transition fade+scale chạy từ trạng thái đóng
  modalEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  modalEl.querySelector('[data-modal-close]').focus();
}

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove('is-open');
  modalEl.classList.add('hidden');
  modalEl.classList.remove('flex');
  document.body.style.overflow = '';
  // Dừng video: gỡ iframe YouTube khỏi DOM (nếu không, âm thanh chạy ngầm)
  const body = modalEl.querySelector('[data-modal-body]');
  if (body && body.querySelector('iframe')) body.innerHTML = '';
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

function openImageModal(src, alt, caption) {
  if (!modalEl) buildModal();
  const body = modalEl.querySelector('[data-modal-body]');
  body.innerHTML = `
    <div class="p-3">
      <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"
           class="mx-auto max-h-[80vh] w-auto rounded-md object-contain">
      ${caption ? `<p class="mt-3 text-center text-base text-text-muted">${escapeHtml(caption)}</p>` : ''}
    </div>`;
  lastFocused = document.activeElement;
  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');
  void modalEl.offsetWidth; // reflow để transition fade+scale chạy từ trạng thái đóng
  modalEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  modalEl.querySelector('[data-modal-close]').focus();
}


/* ==========================================================================
   TRA CỨU HỒ SƠ — client portal (login + dashboard) on /bao-hanh
   ========================================================================== */
const WARRANTY_TIERS = [
  { key: 'ketCau', label: 'Kết cấu' },
  { key: 'chongTham', label: 'Chống thấm' },
  { key: 'hoanThien', label: 'Hoàn thiện' },
];

function fmtDateVN(iso) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? '' : d.toLocaleDateString('vi-VN');
}

// "còn 2 năm 3 tháng" / "còn 25 ngày" / null nếu đã hết hạn
function remainingLabel(end, now) {
  const ms = end - now;
  if (ms <= 0) return null;
  const days = Math.ceil(ms / 86400000);
  if (days < 60) return 'còn ' + days + ' ngày';
  let months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  if (end.getDate() < now.getDate()) months -= 1;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y < 1) return 'còn ' + m + ' tháng';
  return 'còn ' + y + ' năm' + (m ? ' ' + m + ' tháng' : '');
}

/* "10 năm" / "18 tháng" / "2 năm 6 tháng" */
function fmtMonthsVN(n) {
  const y = Math.floor(n / 12);
  const m = n % 12;
  if (y === 0) return `${m} tháng`;
  return m === 0 ? `${y} năm` : `${y} năm ${m} tháng`;
}

/* summary = { ketCau: {months, until}, ... } từ server (hạng mục tắt sẽ vắng mặt) */
function warrantyMetersHtml(handoverIso, summary, compact) {
  const start = new Date(handoverIso + 'T00:00:00');
  const now = new Date();
  // compact: bản thu nhỏ cho thẻ gallery /bao-hanh — cùng thanh wr-*, chữ nhỏ hơn
  const txt = compact ? 'text-sm' : 'text-base';
  const rows = WARRANTY_TIERS.map(({ key, label }) => {
    const tier = summary && summary[key];
    if (!tier || !tier.until) return '';
    const end = new Date(tier.until + 'T23:59:59');
    const remain = remainingLabel(end, now);
    const pctLeft = remain
      ? Math.max(0, Math.min(100, Math.round(((end - now) / (end - start)) * 100)))
      : 0;
    const status = remain ? escapeHtml(remain) : 'Đã hết hạn ' + fmtDateVN(tier.until);
    return `
      <div class="wr-row${remain ? '' : ' is-expired'}${compact ? ' wr-row--compact' : ''}">
        <div class="flex items-baseline justify-between gap-3">
          <span class="${txt} font-medium">${label} <span class="font-normal text-text-muted">(${fmtMonthsVN(tier.months)})</span></span>
          <span class="${txt} text-text-muted">${status}</span>
        </div>
        <div class="wr-track" role="img" aria-label="${label}: ${status}">
          <span class="wr-fill" style="width:${remain ? pctLeft : 100}%"></span>
        </div>
      </div>`;
  });
  return rows.join('');
}

/* ============================================================
   GIẤY BẢO HÀNH ĐÃ CẤP — gallery công khai trên /bao-hanh
   (mọi giấy đã cấp, kể cả hết hạn; ảnh bấm phóng to, PDF mở tab mới)
   ============================================================ */
async function initCertGallery() {
  const gridEl = document.getElementById('cert-grid');
  if (!gridEl) return;

  let certs = [];
  try {
    const res = await fetch('/api/bao-hanh');
    certs = ((await res.json()).certs) || [];
  } catch { certs = []; }

  if (certs.length === 0) {
    gridEl.innerHTML = '<p class="text-base text-text-muted">Danh sách đang được cập nhật.</p>';
    return;
  }

  gridEl.innerHTML = certs.map((c) => {
    const date = c.handover ? fmtDateVN(c.handover) : '';
    const media = c.kind === 'image'
      ? `<img src="${escapeHtml(c.url)}" alt="Giấy bảo hành — ${escapeHtml(c.name)}" loading="lazy" decoding="async"
              data-cert-photo data-caption="${escapeHtml(c.name)}${date ? ' · bàn giao ' + escapeHtml(date) : ''}"
              class="aspect-[4/3] w-full cursor-zoom-in rounded-t-lg bg-bg-secondary object-cover">`
      : `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener"
            class="flex aspect-[4/3] w-full items-center justify-center rounded-t-lg bg-bg-secondary text-text-muted">
           <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
         </a>`;
    // Đếm ngược các hạng mục — cùng thanh wr-* như dashboard /tra-cuu, bản compact
    const meters = c.handover ? warrantyMetersHtml(c.handover, c.warranties, true) : '';
    return `
      <article class="card overflow-hidden p-0">
        ${media}
        <div class="p-4">
          <h3 class="text-base font-semibold">${escapeHtml(c.name)}</h3>
          <p class="mt-0.5 text-sm text-text-muted">${c.project ? escapeHtml(c.project) + ' · ' : ''}${date ? 'Bàn giao ' + escapeHtml(date) : ''}</p>
          ${meters ? `<div class="mt-3">${meters}</div>` : ''}
          <div class="mt-3 flex items-center gap-3 border-t border-border pt-3">
            <img src="/assets/qr-tra-cuu.svg" alt="QR tra cứu hồ sơ" width="64" height="64"
                 loading="lazy" decoding="async" class="h-16 w-16 shrink-0 rounded border border-border">
            <div class="min-w-0">
              <a href="/tra-cuu" class="btn-outline px-3 py-1.5 text-sm">Tra cứu hồ sơ →</a>
              <p class="mt-1.5 text-xs text-text-muted">Quét QR hoặc bấm nút, nhập SĐT đã đăng ký.</p>
            </div>
          </div>
        </div>
      </article>`;
  }).join('');

  gridEl.querySelectorAll('[data-cert-photo]').forEach((img) => {
    img.addEventListener('click', () =>
      openImageModal(img.getAttribute('src'), img.getAttribute('alt'), img.getAttribute('data-caption')));
  });
}

function traCuuDashHtml(data) {
  // Xem trước ngay trong trang: ảnh hiện trong khung (bấm để phóng to qua
  // lightbox chung), PDF nhúng trình xem của trình duyệt; luôn kèm nút tải về.
  const docPreview = (d) => {
    if (d.kind === 'image') {
      return `
        <img src="${escapeHtml(d.url)}" alt="${escapeHtml(d.label)}" loading="lazy" decoding="async"
             data-doc-preview data-caption="${escapeHtml(d.label)}"
             class="mt-3 w-full cursor-zoom-in rounded-lg border border-border bg-bg-secondary object-contain">`;
    }
    if (d.kind === 'pdf') {
      return `
        <object data="${escapeHtml(d.url)}" type="application/pdf" class="mt-3 h-[480px] w-full rounded-lg border border-border">
          <p class="p-4 text-base text-text-muted">Trình duyệt không xem được PDF tại đây — dùng nút tải về bên dưới.</p>
        </object>`;
    }
    return '';
  };
  const docs = (data.docs || []).length
    ? '<div class="mt-4 space-y-5">' + data.docs.map((d) => `
      <div>
        ${docPreview(d)}
        <a href="${escapeHtml(d.url)}" target="_blank" rel="noopener" class="contact-channel mt-3">
          <span class="icon-box shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></span>
          <span class="contact-channel__text">
            <span class="contact-channel__label">Tài liệu</span>
            <span class="contact-channel__value">${escapeHtml(d.label)}</span>
          </span>
          <svg class="shrink-0 text-text-light" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>
        </a>
      </div>`).join('') + '</div>'
    : '<p class="mt-4 text-base text-text-muted">Chưa có tài liệu nào. Hồ sơ sẽ được Sunwa cập nhật tại đây.</p>';

  const logs = (data.logs || []).length
    ? '<ol class="log-list mt-5">' + data.logs.slice().reverse().map((l) => `
        <li class="log-item">
          <span class="log-dot" aria-hidden="true"></span>
          <p class="text-sm font-semibold text-primary">${l.date ? fmtDateVN(l.date) : ''}</p>
          <p class="mt-1 text-base">${escapeHtml(l.text)}</p>
          ${(l.photos || []).length ? `
          <div class="mt-2.5 flex flex-wrap gap-2">
            ${l.photos.map((p) => `
              <img src="${escapeHtml(p)}" alt="Ảnh nhật ký ${l.date ? fmtDateVN(l.date) : ''}" width="120" height="90"
                   loading="lazy" decoding="async" data-log-photo data-caption="${escapeHtml(l.text)}"
                   class="h-[90px] w-[120px] cursor-zoom-in rounded-md border border-border object-cover transition duration-fast hover:border-primary hover:shadow-sm">`).join('')}
          </div>` : ''}
        </li>`).join('') + '</ol>'
    : '<p class="mt-4 text-base text-text-muted">Chưa có nhật ký thi công. Các mốc thi công sẽ xuất hiện tại đây.</p>';

  const warranty = data.handover
    ? `<p class="text-base text-text-muted">Bàn giao ngày <strong class="font-medium text-text">${fmtDateVN(data.handover)}</strong></p>
       <div class="mt-5 space-y-4">${warrantyMetersHtml(data.handover, data.warranty || {})}</div>`
    : '<p class="text-base text-text-muted">Công trình đang thi công — thời hạn bảo hành được kích hoạt từ ngày bàn giao.</p>';

  return `
    <div class="contact-panel p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-start gap-4">
          <span class="icon-box mt-0.5 shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg></span>
          <div>
            <h2 class="text-xl font-semibold leading-tight">${escapeHtml(data.name)}</h2>
            <p class="mt-1 text-base text-text-muted">${escapeHtml(data.project)}</p>
            <p class="mt-2"><span class="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1 text-sm font-medium text-text">Hợp đồng ${escapeHtml(data.code)}</span></p>
          </div>
        </div>
        <button type="button" data-tra-cuu-logout class="btn-outline shrink-0">Đăng xuất</button>
      </div>
      <div class="mt-6 grid grid-cols-1 gap-8 border-t border-border pt-6 lg:grid-cols-2 lg:gap-10">
        <div>
          <h3 class="text-md font-semibold">Hồ sơ &amp; tài liệu</h3>
          ${docs}
        </div>
        <div>
          <h3 class="text-md font-semibold">Thời hạn bảo hành</h3>
          <div class="mt-2">${warranty}</div>
        </div>
      </div>
      <div class="mt-6 border-t border-border pt-6">
        <h3 class="text-md font-semibold">Nhật ký thi công</h3>
        ${logs}
      </div>
    </div>`;
}

function initTraCuu() {
  const form = document.querySelector('[data-tra-cuu-form]');
  const loginBox = document.querySelector('[data-tra-cuu-login]');
  const dash = document.querySelector('[data-tra-cuu-dash]');
  if (!form || !loginBox || !dash) return;

  const errorEl = form.querySelector('[data-tra-cuu-error]');
  const submitBtn = form.querySelector('button[type="submit"]');

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  };

  const showDash = (data) => {
    dash.innerHTML = traCuuDashHtml(data);
    loginBox.classList.add('hidden');
    dash.classList.remove('hidden');
    dash.querySelector('[data-tra-cuu-logout]').addEventListener('click', async () => {
      try { await fetch('/api/tra-cuu/logout', { method: 'POST' }); } catch { /* cookie hết hạn cũng được */ }
      dash.classList.add('hidden');
      dash.innerHTML = '';
      loginBox.classList.remove('hidden');
      form.reset();
    });
    dash.querySelectorAll('[data-log-photo], [data-doc-preview]').forEach((img) => {
      img.addEventListener('click', () =>
        openImageModal(img.getAttribute('src'), img.getAttribute('alt'), img.getAttribute('data-caption')));
    });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    const phone = form.phone.value.trim();
    if (!PHONE_REGEX.test(phone)) return showError('Số điện thoại không hợp lệ.');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang tra cứu…';
    try {
      const res = await fetch('/api/tra-cuu/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) showDash(json);
      else showError(json.error || 'Không tra cứu được. Vui lòng thử lại.');
    } catch {
      showError('Không kết nối được máy chủ. Vui lòng thử lại.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Tra cứu';
    }
  });

  // Phiên còn hạn (cookie 24h) → vào thẳng dashboard, khỏi đăng nhập lại.
  fetch('/api/tra-cuu/me')
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => { if (json && json.ok) showDash(json); })
    .catch(() => {});
}

/* Ảnh tĩnh bấm-phóng-to bất kỳ: gắn data-zoom-image (+ data-caption tuỳ chọn) */
function initZoomImages() {
  document.querySelectorAll('[data-zoom-image]').forEach((img) => {
    const show = () =>
      openImageModal(img.getAttribute('src'), img.getAttribute('alt') || '', img.getAttribute('data-caption') || '');
    img.addEventListener('click', show);
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); }
    });
  });
}

function initModal() {
  const containers = [
    document.getElementById('projects-preview'),
    document.getElementById('projects-grid'),
  ].filter(Boolean);
  if (!containers.length) return;

  const handleActivate = (card) => {
    if (card.classList.contains('is-placeholder')) return; // ô trống — chưa có gì để xem
    const id = Number(card.getAttribute('data-id'));
    const project = PROJECTS.find((p) => p.id === id);
    if (project && project.name) openModal(project);
  };

  containers.forEach((container) => {
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.project-card');
      if (card) handleActivate(card);
    });
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.project-card');
      if (card) {
        e.preventDefault();
        handleActivate(card);
      }
    });
  });

  // Esc đã được đăng ký trong buildModal() — không cần listener trùng ở đây
}

/* ============================================================
   6. FORM VALIDATION + GỬI VỀ /api/submit
   ============================================================ */
const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;

function showFieldError(form, name, message) {
  const errEl = form.querySelector(`[data-error="${name}"]`);
  const input = form.querySelector(`[name="${name}"]`);
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.toggle('hidden', !message);
  }
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateForm(form) {
  let valid = true;

  const name = form.querySelector('[name="name"]');
  if (name && !name.value.trim()) {
    showFieldError(form, 'name', 'Vui lòng nhập họ và tên');
    valid = false;
  } else {
    showFieldError(form, 'name', '');
  }

  const phone = form.querySelector('[name="phone"]');
  if (phone) {
    const v = phone.value.trim();
    if (!PHONE_REGEX.test(v)) {
      showFieldError(form, 'phone', 'Số điện thoại không hợp lệ');
      valid = false;
    } else {
      showFieldError(form, 'phone', '');
    }
  }

  const message = form.querySelector('[name="message"]');
  if (message && !message.value.trim()) {
    showFieldError(form, 'message', 'Vui lòng mô tả yêu cầu của bạn');
    valid = false;
  } else if (message) {
    showFieldError(form, 'message', '');
  }

  const files = form.querySelector('[name="files"]');
  if (files && files.files.length > 0) {
    const err = attachmentError(files.files);
    showFieldError(form, 'files', err || '');
    if (err) valid = false;
  } else if (files && files.required) {
    showFieldError(form, 'files', 'Vui lòng đính kèm hồ sơ lô đất (PDF hoặc ảnh)');
    valid = false;
  } else if (files) {
    showFieldError(form, 'files', '');
  }

  const consent = form.querySelector('[name="consent"]');
  if (consent && !consent.checked) {
    showFieldError(form, 'consent', 'Vui lòng đồng ý để chúng tôi liên hệ');
    valid = false;
  } else if (consent) {
    showFieldError(form, 'consent', '');
  }

  return valid;
}

/* Đính kèm: PDF/ảnh, tối đa 3 tệp, tổng ≤10 MB — trả về chuỗi lỗi hoặc null.
   Phải khớp giới hạn phía server (server.js + lib/mailer.js). */
const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

function attachmentError(fileList) {
  if (fileList.length > MAX_FILES) return `Tối đa ${MAX_FILES} tệp đính kèm`;
  let total = 0;
  for (const f of fileList) {
    total += f.size;
    const okType = f.type === 'application/pdf' || f.type.startsWith('image/');
    if (!okType) return 'Chỉ nhận tệp PDF hoặc ảnh';
  }
  if (total > MAX_TOTAL_BYTES) return 'Tệp đính kèm vượt quá 10 MB';
  return null;
}

/* ============================================================
   BÁO GIÁ THI CÔNG (CÓ PHÍ) — chọn luồng + màn thanh toán VietQR
   Chỉ kích hoạt khi server đã cấu hình SePay (GET /api/thanh-toan/config).
   ============================================================ */
const fmtVND = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

async function initQuoteMode() {
  const toggle = document.querySelector('[data-quote-mode]');
  const form = document.querySelector('[data-quote-form]');
  if (!toggle || !form) return;

  let cfg = null;
  try {
    const res = await fetch('/api/thanh-toan/config');
    const json = await res.json();
    if (json.ok) cfg = json;
  } catch { /* thanh toán chưa sẵn sàng — giữ nguyên form miễn phí */ }
  if (!cfg) return; // không cấu hình → không hiện lựa chọn có phí

  const select = toggle.querySelector('[data-quote-select]');
  if (!select) return;
  const paidOption = select.querySelector('option[value="paid"]');
  if (paidOption) paidOption.textContent = `Gửi yêu cầu Báo giá Thi công (${fmtVND(cfg.fee)})`;
  toggle.classList.remove('hidden');

  const heading = document.querySelector('[data-quote-heading]');
  const submitBtn = form.querySelector('[data-quote-submit]');
  select.addEventListener('change', () => {
    const paid = select.value === 'paid';
    form.dataset.mode = paid ? 'paid' : 'free';
    if (heading) heading.textContent = paid ? 'Gửi yêu cầu Báo giá Thi công' : 'Liên hệ Tư vấn';
    if (submitBtn) {
      submitBtn.textContent = paid
        ? `Tiếp tục — thanh toán ${fmtVND(cfg.fee)} →`
        : 'Liên hệ Tư vấn →';
    }
  });
}

function renderPaymentPanel(order, form) {
  const panel = document.querySelector('[data-payment-panel]');
  if (!panel) return;
  form.classList.add('hidden');
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div class="card p-6">
      <h3 class="text-lg font-semibold">Quét mã để thanh toán ${fmtVND(order.soTien)}</h3>
      <p class="mt-1 text-sm text-text-muted">Đơn <strong class="font-medium text-text">${escapeHtml(order.ma)}</strong> — mã QR đã kèm đúng số tiền và nội dung chuyển khoản.</p>
      <img src="${escapeHtml(order.qrUrl)}" alt="Mã VietQR thanh toán" width="360" height="360"
           class="mx-auto mt-4 w-full max-w-[300px] rounded-lg border border-border">
      <dl class="mt-4 space-y-1 text-sm">
        <div class="flex justify-between gap-3"><dt class="text-text-muted">Ngân hàng</dt><dd class="font-medium">${escapeHtml(order.nganHang)}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-text-muted">Số tài khoản</dt><dd class="select-all font-medium">${escapeHtml(order.soTaiKhoan)}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-text-muted">Chủ tài khoản</dt><dd class="font-medium">${escapeHtml(order.chuTaiKhoan)}</dd></div>
        <div class="flex justify-between gap-3"><dt class="text-text-muted">Nội dung CK (bắt buộc)</dt><dd class="select-all font-semibold text-primary">${escapeHtml(order.noiDung)}</dd></div>
      </dl>
      <p data-pay-status class="mt-4 flex items-center gap-2 rounded-lg bg-bg-secondary px-4 py-3 text-sm text-text-muted">
        <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"></span>
        Đang chờ thanh toán… trang sẽ tự cập nhật ngay khi nhận được tiền (đơn giữ trong 30 phút).
      </p>
    </div>`;

  const statusEl = panel.querySelector('[data-pay-status]');
  const timer = setInterval(async () => {
    try {
      const res = await fetch('/api/thanh-toan/trang-thai/' + encodeURIComponent(order.ma));
      const json = await res.json();
      if (json.status === 'paid') {
        clearInterval(timer);
        panel.innerHTML = `
          <div class="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
            <h3 class="text-lg font-semibold text-text">Đã nhận thanh toán — yêu cầu đã được gửi!</h3>
            <p class="mt-1 text-base text-text-muted">Cảm ơn bạn. Sunwa sẽ gửi báo giá thi công chi tiết trong thời gian sớm nhất. Mã đơn của bạn: <strong>${escapeHtml(order.ma)}</strong>.</p>
          </div>`;
      } else if (json.status === 'expired') {
        clearInterval(timer);
        statusEl.innerHTML = 'Đơn đã hết hạn thanh toán (30 phút). <button type="button" class="font-medium text-primary underline" onclick="location.reload()">Tạo đơn mới</button> hoặc gọi hotline 0916 557 558.';
      }
    } catch { /* mạng chập chờn — thử lại ở nhịp sau */ }
  }, 3000);
}

function initForms() {
  document.querySelectorAll('form.lead-form').forEach((form) => {
    const status = form.querySelector('[data-form-status]');
    const success = document.getElementById(form.getAttribute('data-success') || 'form-success');
    const submitBtn = form.querySelector('[type="submit"]');

    // Danh sách tệp đã chọn + kiểm tra ngay khi chọn (chỉ form có input file)
    const fileInput = form.querySelector('[name="files"]');
    const fileListEl = form.querySelector('[data-file-list]');
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const err = fileInput.files.length > 0 ? attachmentError(fileInput.files) : null;
        showFieldError(form, 'files', err || '');
        if (fileListEl) {
          fileListEl.textContent = Array.from(fileInput.files)
            .map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`)
            .join(' · ');
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) status.textContent = '';
      if (!validateForm(form)) return;

      // FormData multipart: gửi được cả tệp đính kèm; form không có tệp vẫn OK.
      // KHÔNG set Content-Type — trình duyệt tự thêm boundary.
      const data = new FormData(form);
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = 'Đang gửi…';
      }

      try {
        // Luồng CÓ PHÍ (data-mode="paid"): tạo đơn chờ thanh toán thay vì gửi email ngay
        const paid = form.dataset.mode === 'paid';
        const res = await fetch(paid ? '/api/bao-gia-thi-cong' : '/api/submit', { method: 'POST', body: data });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || '');

        if (paid) {
          renderPaymentPanel(json, form);
          return;
        }
        form.classList.add('hidden');
        if (success) success.classList.remove('hidden');
        form.reset();
      } catch (err) {
        if (status) {
          status.textContent = err.message ||
            'Gửi không thành công. Vui lòng gọi hotline 0916 557 558 để được hỗ trợ.';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtn.dataset.label) submitBtn.textContent = submitBtn.dataset.label;
        }
      }
    });
  });
}

/* ============================================================
   7. CALCULATOR CHI PHÍ ƯỚC TÍNH
   ============================================================ */
function initCalculator() {
  const form = document.getElementById('calc-form');
  const typeEl = document.getElementById('calc-type');
  const areaEl = document.getElementById('calc-area');
  const result = document.getElementById('calc-result');
  if (!form || !typeEl || !areaEl || !result) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = typeEl.value;
    const area = parseFloat(areaEl.value);
    const price = PRICE_PER_M2[type];

    if (!price || !area || area <= 0) {
      result.innerHTML =
        '<span class="text-text-muted">Vui lòng chọn loại công trình và nhập diện tích hợp lệ.</span>';
      return;
    }

    const min = formatVND(price.min * area);
    const max = formatVND(price.max * area);
    result.innerHTML = `
      <p class="text-xl font-semibold text-primary">Ước tính: ${min} — ${max} đồng</p>
      <p class="mt-2 text-sm text-text-muted">*Đây là chi phí tham khảo. Báo giá chính xác sau khi khảo sát thực tế.</p>`;
  });
}

/* ============================================================
   8. SCROLL FADE-IN (IntersectionObserver)
   ============================================================ */
function initScrollReveal() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger cascade: tính index trong số .fade-in anh em cùng cha
          const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-in'));
          const i = siblings.indexOf(entry.target);
          if (i > 0) {
            entry.target.style.transitionDelay = Math.min(i, 6) * 120 + 'ms';
            // Xoá delay sau khi reveal xong để không dính vào transition sau này
            entry.target.addEventListener('transitionend', function clear() {
              entry.target.style.transitionDelay = '';
              entry.target.removeEventListener('transitionend', clear);
            });
          }
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  els.forEach((el) => observer.observe(el));
}

/* ============================================================
   11. ACTIVE NAV LINK HIGHLIGHT
   ============================================================ */
function initActiveNav() {
  let path = window.location.pathname.replace(/\/$/, '');
  let current = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  if (current === '') current = 'index.html';
  // Hỗ trợ cả pretty-URL (/du-an) lẫn /du-an.html
  const base = current.replace(/\.html$/, '');

  document.querySelectorAll('[data-page]').forEach((link) => {
    // Chỉ tô sáng .nav-link thật — KHÔNG tô nút .btn-primary "Báo giá ngay"
    // (text-primary trên nền primary = chữ tàng hình) hay logo header.
    if (!link.classList.contains('nav-link')) return;
    const page = link.getAttribute('data-page');
    if (page === base || (base === 'index' && page === 'index')) {
      link.classList.add('nav-link--active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ============================================================
   9. COUNT-UP STATS ("Con số biết nói")
   Đếm 0 → data-target khi section vào viewport, chạy 1 lần.
   ============================================================ */
function initCountUp() {
  const els = document.querySelectorAll('[data-countup]');
  if (!els.length) return;

  const setFinal = (el) =>
    (el.textContent = el.dataset.target + (el.dataset.suffix || ''));

  // Không hỗ trợ IO hoặc người dùng tắt animation → hiện luôn số cuối
  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    els.forEach(setFinal);
    return;
  }

  const DURATION = 1800; // ms
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animate = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / DURATION, 1);
      const value = Math.round(easeOutCubic(t) * target);
      el.textContent = value + suffix;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix; // chốt giá trị chính xác
      }
    };

    el.textContent = '0' + suffix; // reset trước khi đếm
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target); // chạy 1 lần
        }
      });
    },
    { threshold: 0.4 }
  );

  els.forEach((el) => observer.observe(el));
}

/* ============================================================
   9b. TESTIMONIAL CAROUSEL (trượt vô hạn bằng transform)
   Mỗi thẻ hiện 3s → glide sang thẻ kế; tới bản sao thẻ đầu thì
   nhảy về thẻ đầu thật (không animation) ⇒ lặp tới mãi, không lùi.
   ============================================================ */
function initTestimonialCarousel() {
  const root = document.querySelector('[data-testi]');
  if (!root) return;

  const track = root.querySelector('.testi-track');
  if (!track) return;

  // Người dùng tắt animation → CSS xếp chồng tất cả thẻ, không chạy
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const realCount = track.children.length;
  if (realCount < 2) return;

  const DWELL = 5500; // mỗi thẻ hiện ~5.5s
  const GLIDE = 700; // khớp transition trong CSS

  // Nhân bản thẻ đầu, thêm vào cuối để lặp liền mạch
  const clone = track.firstElementChild.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  // Bỏ .fade-in: bản sao sinh ra sau initScrollReveal nên không bao giờ
  // nhận .visible → nếu giữ lại sẽ ở opacity:0 (thẻ trắng khi lặp).
  clone.classList.remove('fade-in');
  track.appendChild(clone);

  let index = 0;
  let timer = null;
  let hovered = false;
  let visible = false;

  const place = (i, animate) => {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translateX(' + -i * 100 + '%)';
  };

  const step = () => {
    index += 1;
    place(index, true);

    if (index === realCount) {
      // Vừa glide tới bản sao thẻ đầu → reset về thẻ đầu thật (không animation)
      window.setTimeout(() => {
        place(0, false);
        index = 0;
        void track.offsetWidth; // ép reflow để bỏ qua transition khi reset
        track.style.transition = '';
        schedule();
      }, GLIDE);
    } else {
      schedule();
    }
  };

  function schedule() {
    timer = window.setTimeout(step, DWELL);
  }

  const start = () => {
    if (!timer) schedule();
  };
  const stop = () => {
    window.clearTimeout(timer);
    timer = null;
  };
  const sync = () => {
    if (visible && !hovered) start();
    else stop();
  };

  // Tạm dừng khi người dùng đang xem/tương tác
  track.addEventListener('mouseenter', () => {
    hovered = true;
    sync();
  });
  track.addEventListener('mouseleave', () => {
    hovered = false;
    sync();
  });
  track.addEventListener('touchstart', () => {
    hovered = true;
    sync();
  }, { passive: true });
  track.addEventListener('touchend', () => {
    hovered = false;
    sync();
  }, { passive: true });

  // Chỉ chạy khi section trong khung nhìn (tiết kiệm tài nguyên)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible = e.isIntersecting;
          sync();
        });
      },
      { threshold: 0.2 }
    );
    io.observe(root);
  } else {
    visible = true;
    sync();
  }
}

/* ============================================================
   10. HERO ENTRANCE ON LOAD
   ============================================================ */
function initHeroReveal() {
  const els = document.querySelectorAll('[data-hero-reveal]');
  if (!els.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Không có hiệu ứng — đảm bảo hiển thị bình thường
    els.forEach((el) => el.classList.add('visible'));
    return;
  }

  els.forEach((el) => el.classList.add('fade-in'));
  requestAnimationFrame(() => {
    els.forEach((el, i) => {
      el.style.transitionDelay = i * 120 + 'ms';
      el.classList.add('visible');
      // Xoá delay sau khi vào xong để không ảnh hưởng transition về sau
      el.addEventListener('transitionend', function clear() {
        el.style.transitionDelay = '';
        el.removeEventListener('transitionend', clear);
      });
    });
  });
}

/* ============================================================
   11. SERVICE SUB-NAV SCROLL-SPY (trang Dịch vụ)
   Tô sáng pill tương ứng dải dịch vụ đang trong khung nhìn.
   No-op nếu trang không có [data-svc-nav].
   ============================================================ */
function initServiceNav() {
  const nav = document.querySelector('[data-svc-nav]');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll('[data-svc-link]'));
  // Ghép id dải -> pill qua hash trong href
  const linkById = new Map();
  const sections = [];
  links.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) {
      linkById.set(id, link);
      sections.push(section);
    }
  });
  if (!sections.length) return;

  // Thanh gạch chân trượt (chỉ hiện ở desktop qua CSS md:block)
  const inner = nav.querySelector('.svc-nav__inner');
  const indicator = document.createElement('span');
  indicator.className = 'svc-nav__indicator';
  if (inner) inner.appendChild(indicator);

  let activeLink = null;
  const moveIndicator = (link) => {
    if (!link) return;
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
  };

  const setActive = (id) => {
    links.forEach((l) => l.classList.remove('svc-nav__link--active'));
    const active = linkById.get(id);
    if (active) {
      active.classList.add('svc-nav__link--active');
      activeLink = active;
      moveIndicator(active);
    }
  };

  // Đặt lại vị trí gạch chân khi đổi kích thước (bề rộng tab thay đổi / đổi breakpoint)
  window.addEventListener('resize', () => moveIndicator(activeLink));

  if (!('IntersectionObserver' in window)) {
    setActive(sections[0].id);
    return;
  }

  // rootMargin trừ hao 2 thanh dính (header + sub-nav) ở trên,
  // và đẩy biên dưới lên để "phần đang đọc" quyết định pill active.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );
  sections.forEach((s) => observer.observe(s));
  setActive(sections[0].id);
}

/* ============================================================
   INIT
   ============================================================ */
/* ============================================================
   TIN TỨC — /tin-tuc (RSS tổng hợp từ /api/news)
   ============================================================ */
async function initNews() {
  const gridEl = document.getElementById('news-grid');
  if (!gridEl) return;

  let items = [];
  try {
    const res = await fetch('/api/news');
    const data = await res.json();
    items = (data && data.items) || [];
  } catch {
    items = [];
  }

  if (items.length === 0) {
    gridEl.innerHTML = '<p class="text-base text-text-muted">Không tải được tin tức. Vui lòng thử lại sau.</p>';
    return;
  }

  gridEl.innerHTML = items.map((it) => {
    const date = it.date
      ? new Date(it.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    // referrerpolicy: báo (Dân Trí) chặn hotlink theo Referer — bỏ Referer thì CDN trả ảnh bình thường
    const thumb = it.thumb
      ? `<img src="${escapeHtml(it.thumb)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" class="aspect-[16/9] w-full rounded-t-lg bg-bg-secondary object-cover">`
      : '<div class="aspect-[16/9] w-full rounded-t-lg bg-bg-secondary"></div>';
    return `
      <article class="card flex flex-col overflow-hidden p-0">
        <a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${thumb}</a>
        <div class="flex flex-1 flex-col gap-2 p-5">
          <p class="text-xs text-text-muted"><span class="font-semibold text-primary">${escapeHtml(it.source)}</span>${date ? ' · ' + escapeHtml(date) : ''}</p>
          <h2 class="text-md font-semibold leading-snug">
            <a href="${escapeHtml(it.link)}" target="_blank" rel="noopener" class="hover:text-primary">${escapeHtml(it.title)}</a>
          </h2>
          <p class="text-sm text-text-muted">${escapeHtml(it.snippet)}</p>
        </div>
      </article>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initHeroReveal();
  renderProjects(); // phải chạy trước initModal / initScrollReveal
  initSmoothScroll();
  initModal();
  initZoomImages();
  initTraCuu();
  initForms();
  initQuoteMode();
  initCalculator();
  initScrollReveal();
  initCountUp();
  initTestimonialCarousel();
  initActiveNav();
  initServiceNav();
  initNews();
  initCertGallery();
});
