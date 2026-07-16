# Cổng tra cứu hồ sơ khách hàng (/tra-cuu) — hướng dẫn quản lý dữ liệu

Khách hàng đăng nhập tại **https://\<domain\>/tra-cuu** — trang ẨN, không có link nào trên site,
chỉ tới được qua **QR in trên giấy chứng nhận bảo hành** (QR do Sunwa tự in, trỏ về URL trên).
Đăng nhập bằng **số điện thoại đã đăng ký** (chỉ cần SĐT — không cần mã). Sau khi đăng nhập họ
thấy: tài liệu (giấy bảo hành, hợp đồng, thiết kế…), nhật ký thi công, và thời hạn bảo hành
(kết cấu 5 năm · chống thấm 3 năm · hoàn thiện 1 năm, tính từ ngày bàn giao).
Trang `/bao-hanh` công khai giờ CHỈ hiển thị giấy chứng nhận mẫu.

**Trang quản trị: http://localhost:3000/quan-tri — CHỈ mở được trên chính Mac Mini.**
Mọi truy cập qua internet/tunnel nhận 404 (middleware `localOnly`, xem `lib/admin.js`) — từ bên
ngoài trang này coi như không tồn tại. Tại đó có thể: thêm khách (tên + SĐT + ngày bàn giao +
tải giấy bảo hành lên — mã hồ sơ `HD-<năm>-<số>` tự sinh, hạn bảo hành tự tính), xem danh sách
kèm hạn còn/hết, và xoá hồ sơ (chỉ gỡ khỏi tra cứu — thư mục tệp được giữ lại).

Sửa file trực tiếp như trước vẫn được — server tự nhận thay đổi (không cần restart).

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
- **Mã hợp đồng** (khóa của mục): viết HOA — chỉ dùng nội bộ (đặt tên thư mục, hiển thị trên
  dashboard); khách KHÔNG cần nhập mã này.
- **`phone`**: số di động VN 10 số (đầu 03/05/07/08/09) — chính là "mật khẩu" đăng nhập của khách.
  **Mỗi khách một số duy nhất** — không được trùng giữa hai mục (trùng thì khách chỉ thấy mục đầu tiên).
- **`handover`**: ngày bàn giao `YYYY-MM-DD`. Để `null` nếu đang thi công (chưa hiện đếm ngược).
- **`warranty`** (không bắt buộc): ghi đè số năm mặc định, vd `{ "ketCau": 10 }`.
- **`docs[].file`** và **`logs[].photos[]`**: đường dẫn tương đối bên trong thư mục của khách đó.
- **JSON phải hợp lệ** (dấu phẩy, ngoặc). Kiểm tra nhanh:
  `node -e "JSON.parse(require('fs').readFileSync('Private/clients/clients.json'))" && echo OK`

3. Xong — không cần restart. Báo khách: vào **\<domain\>/bao-hanh**, nhập SĐT đã đăng ký.

## Thêm nhật ký thi công cho khách đã có
Thêm một mục vào mảng `logs` (mới nhất hiển thị trên cùng) và chép ảnh vào `nhat-ky/`.

## Bảo mật (đã cài sẵn — chỉ cần biết)
- Đăng nhập sai bị giới hạn 10 lần / 15 phút / IP. Lưu ý: đăng nhập CHỈ bằng SĐT nên ai biết số
  điện thoại của khách đều xem được hồ sơ khách đó — chỉ đưa vào portal những tài liệu chấp nhận
  mức riêng tư này (không để giấy tờ tùy thân, thông tin thanh toán…).
- Phiên đăng nhập là cookie ký HMAC (khóa `SESSION_SECRET` trong `.env`), hạn 24 giờ.
- Khách chỉ tải được file trong đúng thư mục của mình; mọi truy cập khác bị chặn.
- Đổi `SESSION_SECRET` sẽ đăng xuất toàn bộ khách (dùng khi nghi ngờ lộ khóa).

## Khách demo
SĐT `0900000001` (mã nội bộ `DEMO-001`) — dữ liệu mẫu để thử. Xóa mục này khi đưa khách thật lên.
