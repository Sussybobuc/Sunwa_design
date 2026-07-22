#!/usr/bin/env node
'use strict';

// `npm run doctor` — kiểm tra sức khoẻ website ngay tại chỗ, in kết quả tiếng Việt
// kèm hướng xử lý cho từng mục hỏng. KHÔNG gửi email, KHÔNG tạo bản sao lưu.
// Dùng chung danh sách kiểm tra với deploy/healthcheck.js (một nguồn duy nhất).

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { CHECKS } = require('./healthcheck');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const OFF = '\x1b[0m';

async function main() {
  // Bỏ qua các mục có tác dụng phụ (mục sao lưu tạo file .tar.gz).
  const checks = CHECKS.filter((c) => !c.sideEffect);

  console.log(`\n${BOLD}Kiểm tra website Sunwa Design${OFF}  ${DIM}${new Date().toLocaleString('vi-VN')}${OFF}\n`);

  const failures = [];
  for (const check of checks) {
    let ok = true;
    let detail = '';
    try {
      detail = await check.run();
    } catch (err) {
      ok = false;
      detail = err.message;
      failures.push(check);
    }
    const mark = ok ? `${GREEN}✓${OFF}` : `${RED}✗${OFF}`;
    console.log(`${mark} ${check.name}\n   ${DIM}${detail}${OFF}`);
    if (!ok && check.fix) console.log(`   ${BOLD}→ Cách xử lý:${OFF} ${check.fix}`);
    console.log('');
  }

  if (failures.length === 0) {
    console.log(`${GREEN}${BOLD}Tất cả đều ổn.${OFF} Website đang chạy bình thường.\n`);
    return;
  }

  console.log(`${RED}${BOLD}${failures.length} mục có vấn đề:${OFF} ${failures.map((c) => c.name).join(', ')}`);
  console.log(`\nCòn bí thì xem ${BOLD}deploy/SU-CO.md${OFF} — hướng dẫn xử lý sự cố từng bước.\n`);
  process.exitCode = 1;
}

main();
