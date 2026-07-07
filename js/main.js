'use strict';

/* ============================================================
   DATA — 7 dự án mẫu
   ============================================================ */
const PROJECTS = [
  {
    id: 1,
    name: 'Nhà anh Minh — Sơn Trà',
    type: 'nha-pho',
    typeLabel: 'Nhà phố 3 tầng',
    area: '120 m²',
    cost: '850 triệu',
    duration: '5 tháng',
    location: 'Sơn Trà, Đà Nẵng',
    year: 2024,
    query: 'modern,townhouse',
    description: 'Nhà phố 3 tầng phong cách hiện đại tối giản, tối ưu ánh sáng tự nhiên.',
  },
  {
    id: 2,
    name: 'Biệt thự chị Lan — Ngũ Hành Sơn',
    type: 'biet-thu',
    typeLabel: 'Biệt thự',
    area: '280 m²',
    cost: '2.4 tỷ',
    duration: '9 tháng',
    location: 'Ngũ Hành Sơn, Đà Nẵng',
    year: 2023,
    query: 'villa,pool',
    description: 'Biệt thự sân vườn kết hợp hồ bơi, phong cách nhiệt đới hiện đại.',
  },
  {
    id: 3,
    name: 'Nhà anh Tùng — Liên Chiểu',
    type: 'nha-cap-4',
    typeLabel: 'Nhà cấp 4',
    area: '90 m²',
    cost: '420 triệu',
    duration: '3 tháng',
    location: 'Liên Chiểu, Đà Nẵng',
    year: 2024,
    query: 'house,bungalow',
    description: 'Nhà cấp 4 mái thái, thiết kế thông thoáng, phù hợp khí hậu Đà Nẵng.',
  },
  {
    id: 4,
    name: 'Cải tạo nhà chị Hoa — Cẩm Lệ',
    type: 'cai-tao',
    typeLabel: 'Cải tạo',
    area: '65 m²',
    cost: '180 triệu',
    duration: '2 tháng',
    location: 'Cẩm Lệ, Đà Nẵng',
    year: 2024,
    query: 'home,renovation',
    description: 'Nâng cấp toàn bộ nội thất và mặt tiền, giữ nguyên kết cấu cũ.',
  },
  {
    id: 5,
    name: 'Nhà anh Bình — Hải Châu',
    type: 'nha-pho',
    typeLabel: 'Nhà phố 4 tầng',
    area: '160 m²',
    cost: '1.2 tỷ',
    duration: '7 tháng',
    location: 'Hải Châu, Đà Nẵng',
    year: 2023,
    query: 'building,facade',
    description: 'Nhà phố kết hợp kinh doanh tầng trệt, 3 tầng ở trên, thang máy gia đình.',
  },
  {
    id: 6,
    name: 'Biệt thự anh Nam — Hòa Xuân',
    type: 'biet-thu',
    typeLabel: 'Biệt thự',
    area: '350 m²',
    cost: '3.1 tỷ',
    duration: '12 tháng',
    location: 'Hòa Xuân, Đà Nẵng',
    year: 2022,
    query: 'mediterranean,villa',
    description: 'Biệt thự đơn lập 2 tầng phong cách Địa Trung Hải, mái ngói đỏ đặc trưng.',
  },
  {
    id: 7,
    name: 'Nhà vườn chị Thu — Hòa Vang',
    type: 'nha-cap-4',
    typeLabel: 'Nhà vườn',
    area: '200 m²',
    cost: '680 triệu',
    duration: '5 tháng',
    location: 'Hòa Vang, Đà Nẵng',
    year: 2023,
    query: 'garden,house',
    description: 'Nhà vườn mái thái rộng, sân vườn cây xanh, không gian nghỉ dưỡng.',
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
  const mqDesktop = window.matchMedia('(min-width: 768px)');
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
function projectCardHtml(p) {
  return `
    <article class="project-card group fade-in" data-type="${p.type}" data-id="${p.id}" tabindex="0" role="button"
             aria-label="Xem chi tiết ${escapeHtml(p.name)}">
      <div class="relative aspect-[4/3] overflow-hidden bg-bg-dark">
        <span class="project-tag">${escapeHtml(p.typeLabel)}</span>
        <img src="${imageUrl(p.query, p.id)}" alt="${escapeHtml(p.name)}" loading="lazy"
             class="h-full w-full object-cover transition duration-normal group-hover:scale-105">
      </div>
      <div class="p-4">
        <h3 class="text-lg font-medium text-text">${escapeHtml(p.name)}</h3>
        <p class="mt-1 text-base text-text-muted">${escapeHtml(p.area)} · ${escapeHtml(p.cost)} · ${escapeHtml(p.duration)}</p>
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
   4. FILTER DỰ ÁN THEO LOẠI
   ============================================================ */
function initFilter() {
  const tabs = document.querySelectorAll('[data-filter]');
  const gridEl = document.getElementById('projects-grid');
  if (!tabs.length || gridEl === null) return;

  // Gạch chân trượt (chỉ hiện ở desktop qua CSS md:block)
  const bar = document.querySelector('[data-filter-bar]');
  let indicator = null;
  let activeTab =
    document.querySelector('.filter-tab--active') || tabs[0];
  const moveIndicator = (tab) => {
    if (!indicator || !tab) return;
    indicator.style.width = tab.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
  };
  if (bar) {
    indicator = document.createElement('span');
    indicator.className = 'filter-bar__indicator';
    bar.appendChild(indicator);
    moveIndicator(activeTab);
    window.addEventListener('resize', () => moveIndicator(activeTab));
    // Font web tải xong có thể đổi bề rộng tab → đặt lại vị trí
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => moveIndicator(activeTab));
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-filter');

      tabs.forEach((t) => t.classList.remove('filter-tab--active'));
      tab.classList.add('filter-tab--active');
      activeTab = tab;
      moveIndicator(tab);

      gridEl.querySelectorAll('.project-card').forEach((card) => {
        const match = filter === 'all' || card.getAttribute('data-type') === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });
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
  body.innerHTML = `
    <div class="aspect-[16/9] w-full overflow-hidden rounded-t-lg bg-bg-dark">
      <img src="${imageUrl(project.query, project.id, '1200x675')}" alt="${escapeHtml(project.name)}"
           loading="lazy" class="h-full w-full object-cover">
    </div>
    <div class="p-6">
      <span class="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">${escapeHtml(project.typeLabel)}</span>
      <h3 class="mt-3 text-2xl font-semibold text-text">${escapeHtml(project.name)}</h3>
      <dl class="mt-4 grid grid-cols-2 gap-3 text-base">
        <div><dt class="text-text-muted">Địa điểm</dt><dd class="font-medium">${escapeHtml(project.location)}</dd></div>
        <div><dt class="text-text-muted">Diện tích</dt><dd class="font-medium">${escapeHtml(project.area)}</dd></div>
        <div><dt class="text-text-muted">Tổng đầu tư</dt><dd class="font-medium">${escapeHtml(project.cost)}</dd></div>
        <div><dt class="text-text-muted">Thời gian thi công</dt><dd class="font-medium">${escapeHtml(project.duration)}</dd></div>
      </dl>
      <p class="mt-4 text-md leading-relaxed text-text-muted">${escapeHtml(project.description)}</p>
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

function initInsuranceModal() {
  const btn = document.querySelector('[data-insurance]');
  if (!btn) return;
  btn.addEventListener('click', () =>
    openImageModal('/materials/Insurance.webp', 'Giấy Chứng nhận Bảo hành', 'Giấy Chứng nhận Bảo hành'));
  // Esc đã được initModal() xử lý chung (cùng modalEl) — không cần listener trùng ở đây.
}

function initModal() {
  const containers = [
    document.getElementById('projects-preview'),
    document.getElementById('projects-grid'),
  ].filter(Boolean);
  if (!containers.length) return;

  const handleActivate = (card) => {
    const id = Number(card.getAttribute('data-id'));
    const project = PROJECTS.find((p) => p.id === id);
    if (project) openModal(project);
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

  const consent = form.querySelector('[name="consent"]');
  if (consent && !consent.checked) {
    showFieldError(form, 'consent', 'Vui lòng đồng ý để chúng tôi liên hệ');
    valid = false;
  } else if (consent) {
    showFieldError(form, 'consent', '');
  }

  return valid;
}

function initForms() {
  document.querySelectorAll('form.lead-form').forEach((form) => {
    const status = form.querySelector('[data-form-status]');
    const success = document.getElementById(form.getAttribute('data-success') || 'form-success');
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) status.textContent = '';
      if (!validateForm(form)) return;

      const data = Object.fromEntries(new FormData(form).entries());
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = 'Đang gửi…';
      }

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Request failed');

        form.classList.add('hidden');
        if (success) success.classList.remove('hidden');
        form.reset();
      } catch (err) {
        if (status) {
          status.textContent =
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
document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initHeroReveal();
  renderProjects(); // phải chạy trước initModal / initScrollReveal
  initSmoothScroll();
  initFilter();
  initModal();
  initInsuranceModal();
  initForms();
  initCalculator();
  initScrollReveal();
  initCountUp();
  initTestimonialCarousel();
  initActiveNav();
  initServiceNav();
});
