'use strict';

const nodemailer = require('nodemailer');

const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;

const TYPE_LABELS = {
  'nha-pho': 'Nhà phố',
  'biet-thu': 'Biệt thự',
  'nha-cap-4': 'Nhà cấp 4',
  'cai-tao': 'Cải tạo sửa chữa',
  'thiet-ke': 'Thiết kế kiến trúc',
};

function clean(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, max || 500);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = async function (context, req) {
  const respond = (status, body) => {
    context.res = {
      status,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  };

  if (req.method !== 'POST') {
    return respond(405, { ok: false, error: 'Method not allowed' });
  }

  const data = req.body || {};
  const name = clean(data.name, 120);
  const phone = clean(data.phone, 20);
  const email = clean(data.email, 160);
  const type = clean(data.type, 40);
  const area = clean(data.area, 60);
  const address = clean(data.address, 200);
  const message = clean(data.message, 2000);
  const consent = clean(data.consent, 10);

  // ----- Server-side validation -----
  if (!name) {
    return respond(400, { ok: false, error: 'Vui lòng nhập họ và tên.' });
  }
  if (!PHONE_REGEX.test(phone)) {
    return respond(400, { ok: false, error: 'Số điện thoại không hợp lệ.' });
  }
  if (consent !== 'yes') {
    return respond(400, { ok: false, error: 'Cần đồng ý để được liên hệ tư vấn.' });
  }

  // ----- SMTP config -----
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const TO_EMAIL = process.env.TO_EMAIL || 'Sunwa.design@gmail.com';
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

  if (!SMTP_USER || !SMTP_PASS) {
    context.log.error('SMTP credentials are not configured (SMTP_USER / SMTP_PASS).');
    return respond(500, {
      ok: false,
      error: 'Hệ thống gửi email chưa được cấu hình. Vui lòng gọi hotline 0916 557 558.',
    });
  }

  const typeLabel = TYPE_LABELS[type] || type || '(không rõ)';

  const lines = [
    `Họ và tên: ${name}`,
    `Số điện thoại: ${phone}`,
    email ? `Email: ${email}` : null,
    `Loại công trình: ${typeLabel}`,
    area ? `Diện tích: ${area}` : null,
    address ? `Địa chỉ: ${address}` : null,
    message ? `Mô tả: ${message}` : null,
  ].filter(Boolean);

  const html = `
    <h2 style="margin:0 0 12px">Yêu cầu mới từ website Sunwa Design</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Họ và tên</td><td><strong>${esc(name)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Số điện thoại</td><td><strong>${esc(phone)}</strong></td></tr>
      ${email ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Email</td><td>${esc(email)}</td></tr>` : ''}
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Loại công trình</td><td>${esc(typeLabel)}</td></tr>
      ${area ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Diện tích</td><td>${esc(area)}</td></tr>` : ''}
      ${address ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Địa chỉ</td><td>${esc(address)}</td></tr>` : ''}
      ${message ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C;vertical-align:top">Mô tả</td><td>${esc(message)}</td></tr>` : ''}
    </table>`;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Website Sunwa Design" <${SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: email || undefined,
      subject: `[Sunwa Design] Yêu cầu báo giá — ${name} (${phone})`,
      text: lines.join('\n'),
      html,
    });

    return respond(200, { ok: true });
  } catch (err) {
    context.log.error('Failed to send email:', err && err.message);
    return respond(502, {
      ok: false,
      error: 'Gửi email không thành công. Vui lòng thử lại hoặc gọi hotline 0916 557 558.',
    });
  }
};
