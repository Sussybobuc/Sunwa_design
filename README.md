# Sunwa Design — Website

Website tĩnh cho **CÔNG TY TNHH MTV Thiết kế và Xây dựng Sunwa** (Đà Nẵng).
HTML thuần + **Tailwind CSS** (build qua CLI) + **Azure Functions** (xử lý form) →
deploy lên **Azure Static Web Apps**.

## Cấu trúc

```
index.html, du-an.html, dich-vu.html, bao-gia.html, lien-he.html
css/tailwind.css  → (build) → css/style.css
js/main.js        ← toàn bộ logic (render dự án, filter, modal, form, calculator, ...)
api/submit/       ← Azure Function gửi email form qua Gmail SMTP
staticwebapp.config.json, tailwind.config.js, package.json
```

## Phát triển cục bộ

```bash
npm install                 # cài tailwind + swa cli
npm run build:css           # tạo css/style.css (chạy lại sau mỗi lần đổi class)
npm run watch:css           # hoặc: tự build khi sửa file

cd api && npm install && cd ..
cp api/local.settings.json.example api/local.settings.json   # rồi điền SMTP creds
npm run dev                 # swa start — phục vụ web + API tại http://localhost:4280
```

> Mở thẳng `index.html` bằng `file://` vẫn xem được giao diện, nhưng form chỉ hoạt
> động khi chạy qua `npm run dev` (cần API `/api/submit`).

## Cấu hình email (Gmail SMTP)

Form gửi về `TO_EMAIL` qua nodemailer. Cần **App Password** của Gmail (bật 2FA →
tạo app password 16 ký tự). Khai báo trong `api/local.settings.json` (local) và trong
**Azure Portal → Static Web App → Configuration → Application settings** (production):

| Key | Ví dụ |
|-----|-------|
| `SMTP_USER` | `your-gmail@gmail.com` |
| `SMTP_PASS` | app password 16 ký tự |
| `TO_EMAIL`  | `Sunwa.design@gmail.com` |
| `SMTP_HOST` | `smtp.gmail.com` (mặc định) |
| `SMTP_PORT` | `465` (mặc định) |

## Deploy

Push lên nhánh `main` → GitHub Actions (`.github/workflows/azure-static-web-apps.yml`)
build Tailwind và deploy. Cần secret `AZURE_STATIC_WEB_APPS_API_TOKEN` trong repo.

## TODO trước khi go-live
- Cập nhật domain thật trong các thẻ `<link rel="canonical">` và OG image.
- Thay ảnh Unsplash (`source.unsplash.com`) bằng ảnh công trình thật trong `/assets/`.
- Xác nhận **số GPKD** thật cho footer (hiện đang dùng tạm hotline).
- Cấu hình SMTP app password trong Azure App settings.
