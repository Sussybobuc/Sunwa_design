# Cổng tra cứu hồ sơ khách hàng (/bao-hanh) — hướng dẫn quản lý dữ liệu

Khách hàng đăng nhập tại **https://\<domain\>/bao-hanh** (tab "Tra cứu hồ sơ") bằng
**mã hợp đồng + số điện thoại** đã đăng ký. Sau khi đăng nhập họ thấy: tài liệu (hợp đồng,
thiết kế…), nhật ký thi công, và thời hạn bảo hành (kết cấu 5 năm · chống thấm 3 năm ·
hoàn thiện 1 năm, tính từ ngày bàn giao).

**Không có trang quản trị (phase 2).** Nhân viên cập nhật dữ liệu bằng cách sửa file trực tiếp
trên Mac Mini. Server tự nhận thay đổi (không cần restart).

## Dữ liệu nằm ở đâu

```
Private/clients/
├── clients.json          ← thông tin mọi khách hàng (file chính)
└── <MÃ-HỢP-ĐỒNG>/        ← file của từng khách (PDF, ảnh…)
    ├── hop-dong.pdf
    ├── thiet-ke.pdf
    └── nhat-ky/
        └── mong-1.webp
```

> `Private/` **không nằm trong git** (thông tin cá nhân khách hàng không bao giờ được commit).
> Vì vậy thư mục này — cùng với `.env` — phải được **backup riêng** (Time Machine / ổ ngoài).

## Thêm một khách hàng

1. Tạo thư mục `Private/clients/<MÃ-HỢP-ĐỒNG>/` (vd: `HD-2026-014`) và chép file vào đó.
   Ảnh nên nén WebP như quy định trong `Materials/README.md` (khách tải qua mạng).
2. Thêm một mục vào `Private/clients/clients.json`:

```json
"HD-2026-014": {
  "name": "Nguyễn Văn A",
  "phone": "0912345678",
  "project": "Nhà phố 3 tầng — Hải Châu, Đà Nẵng",
  "handover": "2026-03-15",
  "docs": [
    { "file": "hop-dong.pdf", "label": "Hợp đồng thi công" },
    { "file": "thiet-ke.pdf", "label": "Hồ sơ thiết kế" }
  ],
  "logs": [
    { "date": "2026-01-10", "text": "Hoàn thành đổ móng.", "photos": ["nhat-ky/mong-1.webp"] }
  ]
}
```

Ghi chú các trường:
- **Mã hợp đồng** (khóa của mục): viết HOA; khách nhập không phân biệt hoa thường.
- **`phone`**: số di động VN 10 số (đầu 03/05/07/08/09) — đúng số khách sẽ dùng để đăng nhập.
- **`handover`**: ngày bàn giao `YYYY-MM-DD`. Để `null` nếu đang thi công (chưa hiện đếm ngược).
- **`warranty`** (không bắt buộc): ghi đè số năm mặc định, vd `{ "ketCau": 10 }`.
- **`docs[].file`** và **`logs[].photos[]`**: đường dẫn tương đối bên trong thư mục của khách đó.
- **JSON phải hợp lệ** (dấu phẩy, ngoặc). Kiểm tra nhanh:
  `node -e "JSON.parse(require('fs').readFileSync('Private/clients/clients.json'))" && echo OK`

3. Xong — không cần restart. Báo khách: vào **\<domain\>/bao-hanh**, nhập mã + SĐT.

## Thêm nhật ký thi công cho khách đã có
Thêm một mục vào mảng `logs` (mới nhất hiển thị trên cùng) và chép ảnh vào `nhat-ky/`.

## Bảo mật (đã cài sẵn — chỉ cần biết)
- Đăng nhập sai bị giới hạn 10 lần / 15 phút / IP; thông báo lỗi không tiết lộ sai mã hay sai SĐT.
- Phiên đăng nhập là cookie ký HMAC (khóa `SESSION_SECRET` trong `.env`), hạn 24 giờ.
- Khách chỉ tải được file trong đúng thư mục của mình; mọi truy cập khác bị chặn.
- Đổi `SESSION_SECRET` sẽ đăng xuất toàn bộ khách (dùng khi nghi ngờ lộ khóa).

## Khách demo
`DEMO-001` / `0900000001` — dữ liệu mẫu để thử. Xóa mục này khi đưa khách thật lên.
