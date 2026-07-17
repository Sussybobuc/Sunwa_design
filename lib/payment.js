'use strict';

// Báo giá Thi công (có phí) — thanh toán chuyển khoản qua SePay.
// Luồng: tạo đơn pending (+ lưu form & tệp vào Private/orders/) → khách quét
// VietQR với nội dung CK = mã đơn → SePay bắn webhook (Authorization: Apikey …)
// → khớp mã + số tiền → đánh dấu paid + GỬI EMAIL yêu cầu về Sunwa.
// Thiết kế chi tiết: deploy/paid-quote-plan.md.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { normalizeUpload } = require('./admin');

const ORDERS_DIR = path.join(__dirname, '..', 'Private', 'orders');
const PENDING_TTL_MS = 30 * 60 * 1000; // 30 phút chờ chuyển khoản
const PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/; // đồng bộ mailer/portal/main.js
const CODE_REGEX = /BG\d{8}/; // nội dung CK phải chứa mã dạng BG########

// ---------- cấu hình từ .env ----------
function config() {
  return {
    fee: Number(process.env.PAID_QUOTE_FEE || 0),
    apiKey: process.env.SEPAY_API_KEY || '',
    bankId: process.env.BANK_ID || '',            // mã ngân hàng theo vietqr.io (vd: VCB, TCB, MB)
    bankAccount: process.env.BANK_ACCOUNT_NUMBER || '',
    bankName: process.env.BANK_ACCOUNT_NAME || '',
  };
}

function configured() {
  const c = config();
  return Boolean(c.fee > 0 && c.apiKey && c.bankId && c.bankAccount);
}

// ---------- kho đơn (mỗi đơn 1 file JSON + 1 thư mục tệp) ----------
function orderPath(code) {
  return path.join(ORDERS_DIR, `${code}.json`);
}

function readOrder(code) {
  try {
    return JSON.parse(fs.readFileSync(orderPath(code), 'utf8'));
  } catch {
    return null;
  }
}

function writeOrder(order) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
  const tmp = orderPath(order.code) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(order, null, 2) + '\n');
  fs.renameSync(tmp, orderPath(order.code));
}

function newCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = 'BG' + String(crypto.randomInt(0, 100000000)).padStart(8, '0');
    if (!fs.existsSync(orderPath(code))) return code;
  }
  throw new Error('không sinh được mã đơn');
}

// Hết hạn LƯỜI: đánh dấu expired khi được đọc tới (poll/webhook/danh sách)
function withExpiry(order) {
  if (order && order.status === 'pending' && Date.now() - order.createdAt > PENDING_TTL_MS) {
    order.status = 'expired';
    writeOrder(order);
  }
  return order;
}

function qrUrl(code) {
  const c = config();
  const params = new URLSearchParams({
    amount: String(c.fee),
    addInfo: code,
    accountName: c.bankName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(c.bankId)}-${encodeURIComponent(c.bankAccount)}-compact2.png?${params}`;
}

function publicOrder(order) {
  const c = config();
  return {
    ok: true,
    ma: order.code,
    status: order.status,
    soTien: order.fee,
    noiDung: order.code,
    nganHang: c.bankId,
    soTaiKhoan: c.bankAccount,
    chuTaiKhoan: c.bankName,
    qrUrl: qrUrl(order.code),
  };
}

// ---------- email (gửi SAU khi đã thanh toán) ----------
function buildTransport() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const clientId = process.env.OAUTH_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN;
  if (!user) return null;
  const auth = clientId && clientSecret && refreshToken
    ? { type: 'OAuth2', user, clientId, clientSecret, refreshToken }
    : process.env.SMTP_PASS ? { user, pass: process.env.SMTP_PASS } : null;
  if (!auth) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth,
  });
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendPaidQuoteEmail(order) {
  const transporter = buildTransport();
  if (!transporter) throw new Error('mail chưa cấu hình');
  const f = order.form;
  const dir = path.join(ORDERS_DIR, order.code);
  const attachments = (order.files || []).map((name) => ({ filename: name, path: path.join(dir, name) }));
  const rows = [
    ['Mã đơn', order.code],
    ['ĐÃ THANH TOÁN', `${order.fee.toLocaleString('vi-VN')}đ (${order.tx ? order.tx.referenceCode || order.tx.id : 'khớp tay'})`],
    ['Họ và tên', f.name],
    ['Số điện thoại', f.phone],
    ['Email', f.email],
    ['Địa chỉ xây dựng', f.address],
    ['Mô tả', f.message],
  ].filter(([, v]) => v);
  await transporter.sendMail({
    from: `"Website Sunwa Design" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
    to: process.env.TO_EMAIL || 'Sunwa.design@gmail.com',
    replyTo: f.email || undefined,
    subject: `[Sunwa Design] BÁO GIÁ THI CÔNG (ĐÃ THANH TOÁN) — ${f.name} (${f.phone})`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<h2 style="margin:0 0 12px">Đơn BÁO GIÁ THI CÔNG đã thanh toán</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#78716C;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}
      </table>`,
    attachments,
  });
}

// Hoàn tất đơn: idempotent — gọi từ webhook hoặc "khớp tay" trong quản trị.
async function finalizeOrder(order, tx) {
  if (order.status === 'paid') return order;
  order.status = 'paid';
  order.paidAt = Date.now();
  order.tx = tx || null;
  writeOrder(order);
  try {
    await sendPaidQuoteEmail(order);
    order.emailSent = true;
  } catch (err) {
    // Đơn vẫn paid — admin thấy emailSent=false trong /quan-tri và xử lý tay.
    console.error(`Đơn ${order.code} đã thanh toán nhưng GỬI EMAIL LỖI:`, err.message);
    order.emailSent = false;
  }
  writeOrder(order);
  return order;
}

// ---------- handlers ----------

// GET /api/thanh-toan/config — công khai (không lộ bí mật): phí + tài khoản nhận
function handleConfig(req, res) {
  const c = config();
  if (!configured()) return res.json({ ok: false });
  res.json({ ok: true, fee: c.fee, bankId: c.bankId, bankAccount: c.bankAccount, bankName: c.bankName });
}

// POST /api/bao-gia-thi-cong (multipart như /api/submit) → tạo đơn pending + trả QR
async function handleCreateOrder(req, res) {
  if (!configured()) {
    return res.status(500).json({ ok: false, error: 'Thanh toán chưa được cấu hình. Vui lòng dùng form Tư vấn miễn phí hoặc gọi hotline 0916 557 558.' });
  }
  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 120);
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim().slice(0, 160);
  const address = String(body.address || '').trim().slice(0, 200);
  const message = String(body.message || '').trim().slice(0, 2000);
  const consent = String(body.consent || '').trim();
  const files = req.files || [];

  if (!name) return res.status(400).json({ ok: false, error: 'Vui lòng nhập họ và tên.' });
  if (!PHONE_REGEX.test(phone)) return res.status(400).json({ ok: false, error: 'Số điện thoại không hợp lệ.' });
  if (!message) return res.status(400).json({ ok: false, error: 'Vui lòng mô tả yêu cầu của bạn.' });
  if (consent !== 'yes') return res.status(400).json({ ok: false, error: 'Cần đồng ý để được liên hệ tư vấn.' });
  if (files.length === 0) return res.status(400).json({ ok: false, error: 'Vui lòng đính kèm hồ sơ lô đất (PDF hoặc ảnh).' });

  const code = newCode();
  const dir = path.join(ORDERS_DIR, code);
  const savedNames = [];
  try {
    fs.mkdirSync(dir, { recursive: true });
    for (const file of files) {
      const { buffer, filename } = await normalizeUpload(file);
      let final = filename;
      if (savedNames.includes(final)) final = final.replace(/(\.[^.]+)$/, `-${savedNames.length}$1`);
      fs.writeFileSync(path.join(dir, final), buffer);
      savedNames.push(final);
    }
  } catch (err) {
    console.error('Tạo đơn báo giá lỗi khi lưu tệp:', err.message);
    return res.status(500).json({ ok: false, error: 'Không lưu được tệp đính kèm. Vui lòng thử lại.' });
  }

  const order = {
    code,
    status: 'pending',
    createdAt: Date.now(),
    fee: config().fee,
    form: { name, phone, email, address, message },
    files: savedNames,
  };
  writeOrder(order);
  res.json(publicOrder(order));
}

// GET /api/thanh-toan/trang-thai/:ma — khách poll trong lúc chờ chuyển khoản
function handleStatus(req, res) {
  const code = String(req.params.ma || '').toUpperCase();
  const order = code && CODE_REGEX.test(code) ? withExpiry(readOrder(code)) : null;
  if (!order) return res.status(404).json({ ok: false });
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, status: order.status });
}

// POST /api/thanh-toan/webhook — CHỈ SePay gọi (Authorization: Apikey <SEPAY_API_KEY>)
async function handleWebhook(req, res) {
  const c = config();
  const header = String(req.headers.authorization || '');
  const expected = `Apikey ${c.apiKey}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (!c.apiKey || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ ok: false });
  }
  try {
    return await processWebhook(req, res);
  } catch (err) {
    // Không bao giờ để lỗi nội bộ làm SePay retry vô hạn mà không có dấu vết
    console.error('Webhook xử lý lỗi:', err.message);
    return res.status(500).json({ ok: false });
  }
}

async function processWebhook(req, res) {

  const tx = req.body || {};
  // Chỉ quan tâm tiền VÀO
  if (tx.transferType && tx.transferType !== 'in') return res.json({ ok: true, skip: 'not-in' });

  const content = String(tx.content || tx.description || '').toUpperCase();
  const match = content.match(CODE_REGEX);
  const order = match ? withExpiry(readOrder(match[0])) : null;

  if (!order) {
    // Không khớp đơn nào — ghi lại để đối soát tay trong /quan-tri
    fs.mkdirSync(ORDERS_DIR, { recursive: true });
    fs.appendFileSync(path.join(ORDERS_DIR, 'unmatched.log'),
      JSON.stringify({ at: new Date().toISOString(), tx }) + '\n');
    return res.json({ ok: true, skip: 'no-match' });
  }
  if (order.status === 'paid') return res.json({ ok: true, skip: 'already-paid' });
  if (Number(tx.transferAmount) < order.fee) {
    fs.appendFileSync(path.join(ORDERS_DIR, 'unmatched.log'),
      JSON.stringify({ at: new Date().toISOString(), reason: 'thieu-tien', code: order.code, tx }) + '\n');
    return res.json({ ok: true, skip: 'amount-too-low' });
  }

  await finalizeOrder(order, { id: tx.id, referenceCode: tx.referenceCode, amount: tx.transferAmount, gateway: tx.gateway, date: tx.transactionDate });
  res.json({ ok: true });
}

// ---------- quản trị (đứng sau localOnly trong server.js) ----------

function handleAdminList(req, res) {
  let orders = [];
  try {
    orders = fs.readdirSync(ORDERS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => withExpiry(readOrder(f.replace(/\.json$/, ''))))
      .filter(Boolean)
      .sort((x, y) => y.createdAt - x.createdAt)
      .slice(0, 100);
  } catch { /* chưa có đơn nào */ }
  res.json({ ok: true, orders });
}

// Khớp tay khi khách chuyển sai nội dung: admin bấm sau khi tự đối chiếu sao kê.
async function handleAdminMarkPaid(req, res) {
  const order = readOrder(String(req.params.ma || '').toUpperCase());
  if (!order) return res.status(404).json({ ok: false, error: 'Không tìm thấy đơn.' });
  await finalizeOrder(order, null);
  res.json({ ok: true, order });
}

module.exports = {
  handleConfig, handleCreateOrder, handleStatus, handleWebhook,
  handleAdminList, handleAdminMarkPaid,
};
