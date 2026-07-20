'use strict';

// Báo lỗi thi công (trang /bao-hanh) — khách nhập SĐT ĐÃ ĐĂNG KÝ + mô tả lỗi
// (kèm ảnh tuỳ chọn), hệ thống tra ra đúng khách theo số rồi gửi email cho Sunwa.
// Không lưu xuống đĩa — chỉ gửi mail (dùng chung transport với lib/mailer.js).

const portal = require('./portal');
const mailer = require('./mailer');

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

async function handleReport(data, files) {
  const phone = clean(data.phone, 20);
  const message = clean(data.message, 2000);

  // SĐT phải khớp một khách đã đăng ký (chính là "chìa khoá" tra cứu hồ sơ).
  const found = portal.findClientByPhone(phone);
  if (!found) {
    return {
      status: 401,
      body: {
        ok: false,
        error: 'Số điện thoại chưa được đăng ký. Vui lòng gọi hotline 0916 557 558 nếu cần hỗ trợ.',
      },
    };
  }
  if (!message) {
    return { status: 400, body: { ok: false, error: 'Vui lòng mô tả lỗi thi công.' } };
  }

  const { code, client } = found;
  const name = client.name || '';
  const project = client.project || '';
  const handover = client.handover || '';

  const attachments = (files || []).map((f) => ({
    filename: String(f.originalname || 'anh-loi').replace(/[/\\]/g, '_'),
    content: f.buffer,
    contentType: f.mimetype,
  }));

  const lines = [
    `Khách hàng: ${name}`,
    `Mã hợp đồng: ${code}`,
    project ? `Công trình: ${project}` : null,
    handover ? `Ngày bàn giao: ${handover}` : null,
    `Số điện thoại: ${phone}`,
    `Mô tả lỗi: ${message}`,
    attachments.length ? `Ảnh đính kèm: ${attachments.length} tệp` : null,
  ].filter(Boolean);

  const html = `
    <h2 style="margin:0 0 12px">Báo lỗi thi công từ khách hàng Sunwa Design</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Khách hàng</td><td><strong>${esc(name)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Mã hợp đồng</td><td><strong>${esc(code)}</strong></td></tr>
      ${project ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Công trình</td><td>${esc(project)}</td></tr>` : ''}
      ${handover ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Ngày bàn giao</td><td>${esc(handover)}</td></tr>` : ''}
      <tr><td style="padding:4px 12px 4px 0;color:#78716C">Số điện thoại</td><td><strong>${esc(phone)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#78716C;vertical-align:top">Mô tả lỗi</td><td>${esc(message)}</td></tr>
      ${attachments.length ? `<tr><td style="padding:4px 12px 4px 0;color:#78716C">Ảnh đính kèm</td><td>${attachments.length} tệp</td></tr>` : ''}
    </table>`;

  return mailer.deliver({
    subject: `[Sunwa Design] BÁO LỖI THI CÔNG — ${name} (${code})`,
    text: lines.join('\n'),
    html,
    attachments,
  });
}

module.exports = { handleReport };
