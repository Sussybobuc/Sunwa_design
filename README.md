# Sunwa Design — Website

Website cho **CÔNG TY TNHH MTV Thiết kế và Xây dựng Sunwa** (Đà Nẵng).
HTML thuần + **Tailwind CSS** (build qua CLI) + **Express** (`server.js`) phục vụ trang
tĩnh và xử lý form → deploy lên **Azure App Service**.

## Cấu trúc

```
index.html, du-an.html, dich-vu.html, bao-gia.html, lien-he.html
css/tailwind.css  → (build) → css/style.css
js/main.js        ← toàn bộ logic (render dự án, filter, modal, form, calculator, ...)
server.js         ← Express: phục vụ trang + route POST /api/submit
lib/mailer.js     ← gửi email form qua Gmail SMTP (nodemailer)
tailwind.config.js, package.json
```

## Phát triển cục bộ

```bash
npm install                 # cài express, nodemailer + tailwind
npm run build:css           # tạo css/style.css (chạy lại sau mỗi lần đổi class)
npm run watch:css           # hoặc: tự build khi sửa file
npm start                   # node server.js — phục vụ web + API tại http://localhost:3000
```

> Mở thẳng `index.html` bằng `file://` sẽ hỏng (pretty URL, đường dẫn asset, form).
> Luôn chạy qua `npm start`.

## Cấu hình email (Gmail SMTP)

Form gửi về `TO_EMAIL` qua nodemailer. Cần **App Password** của Gmail (bật 2FA →
tạo app password 16 ký tự). Local: đặt biến môi trường trong session trước khi `npm start`.
Production: **Azure Portal → App Service → Configuration → Application settings**:

| Key | Ví dụ |
|-----|-------|
| `SMTP_USER` | `your-gmail@gmail.com` |
| `SMTP_PASS` | app password 16 ký tự |
| `TO_EMAIL`  | `Sunwa.design@gmail.com` |
| `SMTP_HOST` | `smtp.gmail.com` (mặc định) |
| `SMTP_PORT` | `465` (mặc định) |

Khi chưa cấu hình SMTP, `/api/submit` trả về 500 với thông báo "chưa được cấu hình";
phần còn lại của site vẫn chạy bình thường.

## Deploy

Tạo **Azure App Service** (Linux, Node 20 LTS), nối **Deployment Center → GitHub**.
Push lên nhánh `main` → build Tailwind và deploy, chạy bằng `npm start`. Đặt các biến
SMTP trong Application settings. Xem chi tiết trong `docs/run-and-deploy.md`.

## TODO trước khi go-live
- Cập nhật domain thật trong các thẻ `<link rel="canonical">` và OG image.
- Thay ảnh Unsplash (`source.unsplash.com`) bằng ảnh công trình thật trong `/assets/`.
- Xác nhận **số GPKD** thật cho footer (hiện đang dùng tạm hotline).
- Cấu hình SMTP app password trong App Service → Application settings.
