# Xử lý sự cố website Sunwa — không cần biết lập trình

Trang này dành cho lúc **không có ai hỗ trợ**. Mọi lệnh đều gõ trong ứng dụng **Terminal**
trên máy Mac Mini. Copy nguyên dòng lệnh, dán vào, bấm Enter.

> **Việc đầu tiên, luôn luôn:** mở Terminal và chạy 2 dòng này.
>
> ```bash
> cd ~/Projects/Sunwa_Design
> npm run doctor
> ```
>
> Máy sẽ tự kiểm tra và in ra danh sách ✓ / ✗. Mục nào ✗ sẽ kèm dòng
> **"→ Cách xử lý"** — làm theo đúng dòng đó là xong phần lớn trường hợp.

---

## 1. Website không vào được

```bash
pm2 restart sunwa
```

Đợi 10 giây rồi thử lại https://sunwadesign.com. Vẫn không được:

```bash
pm2 logs sunwa --lines 40          # xem 40 dòng lỗi gần nhất
sudo launchctl kickstart -k system/com.cloudflare.cloudflared   # khởi động lại đường hầm
```

Nếu `npm run doctor` báo **www.sunwadesign.com** hỏng nhưng trang chính vẫn vào được thì lỗi
nằm ở DNS trên Cloudflare, không phải ở máy Mac.

## 2. Khách gửi form mà Sunwa không nhận được email

```bash
npm run doctor
```

- Mục **Gmail OAuth2** ✗ → mã đăng nhập Gmail đã hết hạn. Lấy mã mới theo
  `docs/run-and-deploy.md` §2.3, rồi sửa file `.env`, rồi chạy `pm2 reload sunwa --update-env`.
- Mục **Không có email tồn đọng** ✗ → **có khách đang chờ mà Sunwa chưa biết**. Xem ngay:

  ```bash
  open ~/Projects/Sunwa_Design/Private/failed-mail
  ```

  Mỗi thư mục là một yêu cầu không gửi được. Mở file `mail.json` trong đó sẽ thấy tên, số
  điện thoại và nội dung khách gửi → **gọi lại cho khách**. Xử lý xong thì xoá thư mục đó đi.

## 3. Sửa xong mà website không thấy đổi

Bình thường **không còn xảy ra** nữa: máy chủ tự gắn số phiên bản vào file giao diện sau mỗi
lần deploy, nên trình duyệt luôn tải bản mới. Nếu vẫn nghi ngờ:

```bash
cd ~/Projects/Sunwa_Design
npm run build:css      # dựng lại giao diện
pm2 reload sunwa       # nạp lại (số phiên bản được tính lúc này)
```

Rồi tải lại trang bằng **⌘ + Shift + R**.

## 4. Thêm / xoá dự án, thêm khách hàng, thêm banner

Không cần lập trình viên:

| Việc | Làm ở đâu |
|---|---|
| Thêm / xoá / sắp xếp dự án | http://localhost:3000/quan-tri — mục **Dự án**, dán link YouTube |
| Thêm khách hàng, giấy bảo hành, hồ sơ | http://localhost:3000/quan-tri — mục **Thêm khách hàng** |
| Đổi banner | Chép file ảnh vào `Materials/banners/` (xem `Materials/README.md`) |

Trang `/quan-tri` **chỉ mở được trên chính máy Mac Mini** — từ internet nó không tồn tại.

## 5. Mất dữ liệu khách hàng

Máy tự sao lưu mỗi ngày lúc 08:00, giữ 30 bản gần nhất.

```bash
ls -lh ~/Backups/sunwa-clients/                       # xem các bản sao lưu
cd ~/Projects/Sunwa_Design
tar -xzf ~/Backups/sunwa-clients/sunwa-2026-07-22.tar.gz Private/clients   # đổi ngày cho đúng
pm2 restart sunwa
```

> ⚠️ **Không bao giờ tự tay xoá thư mục `Private/`.** Đó là dữ liệu khách hàng thật và
> **không nằm trong git** — xoá là mất, chỉ khôi phục được từ bản sao lưu ở trên.

## 6. Máy Mac vừa khởi động lại

Không cần làm gì — website và đường hầm tự chạy lại kể cả khi chưa đăng nhập. Kiểm tra lại:

```bash
npm run doctor
```

---

## Số điện thoại / thông tin cần khi gọi hỗ trợ

Khi nhờ người khác giúp, gửi kèm kết quả của:

```bash
cd ~/Projects/Sunwa_Design && npm run doctor
pm2 logs sunwa --lines 50 --nostream
```

Chi tiết kỹ thuật đầy đủ: [`deploy/README.md`](README.md).
