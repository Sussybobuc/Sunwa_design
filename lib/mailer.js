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

async function handleSubmit(data, files) {
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
    return { status: 400, body: { ok: false, error: 'Vui lòng nhập họ và tên.' } };
  }
  if (!PHONE_REGEX.test(phone)) {
    return { status: 400, body: { ok: false, error: 'Số điện thoại không hợp lệ.' } };
  }
  if (!message) {
    return { status: 400, body: { ok: false, error: 'Vui lòng mô tả yêu cầu của bạn.' } };
  }
  // Form báo giá (hidden source=bao-gia) bắt buộc đính kèm hồ sơ lô đất;
  // form liên hệ không có input file nên không bị ràng buộc này.
  if (clean(data.source, 40) === 'bao-gia' && (!files || files.length === 0)) {
    return { status: 400, body: { ok: false, error: 'Vui lòng đính kèm hồ sơ lô đất (PDF hoặc ảnh).' } };
  }
  if (consent !== 'yes') {
    return { status: 400, body: { ok: false, error: 'Cần đồng ý để được liên hệ tư vấn.' } };
  }

  // ----- Mail transport config -----
  // Accept both the SMTP_*/OAUTH_* names and the GMAIL_* aliases (either set works).
  const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const TO_EMAIL = process.env.TO_EMAIL || 'Sunwa.design@gmail.com';
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

  // OAuth2 (Gmail) — preferred, since Google is phasing out app passwords.
  // Set these in App Service → Configuration → Application settings.
  const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
  const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
  const OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN;

  const hasOAuth = Boolean(OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET && OAUTH_REFRESH_TOKEN);
  const hasPassword = Boolean(SMTP_PASS);

  // Need the sending address plus at least one auth method (OAuth2 or password).
  if (!SMTP_USER || (!hasOAuth && !hasPassword)) {
    console.error(
      'Mail credentials are not configured: set SMTP_USER plus either OAuth2 ' +
        '(OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET / OAUTH_REFRESH_TOKEN) or SMTP_PASS.'
    );
    return {
      status: 500,
      body: {
        ok: false,
        error: 'Hệ thống gửi email chưa được cấu hình. Vui lòng gọi hotline 0916 557 558.',
      },
    };
  }

  // Trường type đã bị gỡ khỏi form báo giá — chỉ hiện dòng này nếu có giá trị
  // (giữ TYPE_LABELS vì calculator trên trang báo giá vẫn dùng các slug này).
  const typeLabel = type ? (TYPE_LABELS[type] || type) : '';

  const attachments = (files || []).map((f) => ({
    filename: String(f.originalname || 'dinh-kem').replace(/[/\\]/g, '_'),
    content: f.buffer,
    contentType: f.mimetype,
  }));

  const lines = [
    `Họ và tên: ${name}`,
    `Số điện thoại: ${phone}`,
    email ? `Email: ${email}` : null,
    typeLabel ? `Loại công trình: ${typeLabel}` : null,
    area ? `Thông tin lô đất: ${area}` : null,
    address ? `Địa chỉ: ${address}` : null,
    message ? `Mô tả: ${message}` : null,
    attachments.length ? `Đính kèm: ${attachments.length} tệp` : null,
  ].filter(Boolean);

  const html = `
    <h2 style="margin:0 0 12px">Yêu cầu mới từ website Sunwa Design</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Họ và tên</td><td><strong>${esc(name)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Số điện thoại</td><td><strong>${esc(phone)}</strong></td></tr>
      ${email ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Email</td><td>${esc(email)}</td></tr>` : ''}
      ${typeLabel ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Loại công trình</td><td>${esc(typeLabel)}</td></tr>` : ''}
      ${area ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Thông tin lô đất</td><td>${esc(area)}</td></tr>` : ''}
      ${address ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Địa chỉ</td><td>${esc(address)}</td></tr>` : ''}
      ${message ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C;vertical-align:top">Mô tả</td><td>${esc(message)}</td></tr>` : ''}
    </table>`;

  try {
    // OAuth2 when configured (nodemailer fetches/refreshes the access token from
    // Google using the refresh token); otherwise fall back to password auth.
    const auth = hasOAuth
      ? {
          type: 'OAuth2',
          user: SMTP_USER,
          clientId: OAUTH_CLIENT_ID,
          clientSecret: OAUTH_CLIENT_SECRET,
          refreshToken: OAUTH_REFRESH_TOKEN,
        }
      : { user: SMTP_USER, pass: SMTP_PASS };

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth,
    });

    await transporter.sendMail({
      from: `"Website Sunwa Design" <${SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: email || undefined,
      subject: `[Sunwa Design] Yêu cầu tư vấn miễn phí — ${name} (${phone})`,
      text: lines.join('\n'),
      html,
      attachments,
    });

    return { status: 200, body: { ok: true } };
  } catch (err) {
    // Log full detail server-side (visible in Azure log stream) but never leak it to clients.
    console.error('Failed to send email:', err && (err.response || err.message), err && err.code);
    return {
      status: 502,
      body: {
        ok: false,
        error: 'Gửi email không thành công. Vui lòng thử lại hoặc gọi hotline 0916 557 558.',
      },
    };
  }
}

module.exports = { handleSubmit };
