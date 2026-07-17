# "Gửi yêu cầu Báo giá Thi công (có phí)" qua SePay

> Trạng thái: **ĐÃ TRIỂN KHAI phía code** (lib/payment.js + routes + UI /bao-gia + mục đơn trong
> /quan-tri + health check guard). Luồng trả phí TỰ ẨN cho tới khi đủ 4 biến SePay trong `.env`
> (xem `.env.example`). Còn lại: đăng ký SePay, điền `.env`, test chuyển khoản thật số tiền nhỏ.

## Mục tiêu
Trang `/bao-gia` sẽ có HAI luồng:
1. **Tư vấn miễn phí** (form hiện tại, giữ nguyên hành vi).
2. **Báo giá Thi công (có phí)** — cùng các trường nhập liệu + đính kèm hồ sơ lô đất, nhưng
   yêu cầu **hoàn tất chuyển khoản** (xác nhận tự động qua banking API) trước khi hệ thống
   gửi email yêu cầu về Sunwa. Mục đích: lọc khách nghiêm túc cho dịch vụ dự toán chi tiết.

## Lựa chọn cổng thanh toán (khuyến nghị theo thứ tự)
| Phương án | Cách hoạt động | Phí | Nhận xét |
|---|---|---|---|
| **SePay** (khuyến nghị #1) | Liên kết tài khoản ngân hàng của Sunwa → SePay đọc biến động số dư, bắn **webhook** khi có giao dịch khớp nội dung chuyển khoản | Gói free/rẻ cho lượng giao dịch nhỏ | Không cần pháp nhân cổng thanh toán, tiền VÀO THẲNG tài khoản Sunwa, tích hợp VietQR dễ |
| **Casso** | Tương tự SePay (đọc biến động số dư + webhook) | Tương đương | Đổi tên payos... cùng hệ sinh thái; so sánh giá tại thời điểm làm |
| **PayOS (Casso)** | Cổng VietQR chuẩn: tạo payment link/QR theo đơn, webhook có chữ ký | ~phí/giao dịch | Chuẩn chỉnh nhất về đối soát + chữ ký webhook; cần đăng ký |
| VNPay/MoMo/ZaloPay | Cổng ví/gateway đầy đủ | Cao hơn, hợp đồng | Quá nặng cho nhu cầu hiện tại |
| API ngân hàng trực tiếp (BIDV/VCB…) | Open banking doanh nghiệp | — | Thủ tục doanh nghiệp phức tạp — không khuyến nghị giai đoạn này |

Quyết định cần chốt trước khi làm: **mức phí** (vd 500.000đ?), **ngân hàng nhận**, và chọn
SePay/PayOS (đăng ký tài khoản + lấy API key, webhook secret).

## Luồng UX dự kiến
1. Khách chọn thẻ "Báo giá Thi công (có phí — XXX.000đ)" → điền form (các trường như form
   tư vấn + đính kèm bắt buộc như hiện tại).
2. Bấm gửi → server tạo **đơn chờ thanh toán** `order` (mã `BG-<năm>-<số>`, lưu payload form
   TẠM trên đĩa `Private/orders/<mã>.json` — chưa gửi email) → trả về **VietQR** (ảnh QR +
   số tài khoản + nội dung CK bắt buộc = mã đơn) hiển thị ngay trong trang cùng đồng hồ chờ.
3. Khách chuyển khoản đúng nội dung → ngân hàng ghi có → SePay/PayOS bắn **webhook** tới
   `POST /api/thanh-toan/webhook` (qua tunnel, xác minh chữ ký/secret, đối chiếu số tiền +
   nội dung = mã đơn).
4. Khớp → server: đánh dấu đơn `paid`, GỬI EMAIL yêu cầu báo giá (kèm ghi chú ĐÃ THANH TOÁN +
   mã giao dịch) → frontend (poll `GET /api/thanh-toan/trang-thai/<mã>` mỗi 3s) hiện màn hình
   thành công.
5. Không thanh toán trong 30 phút → đơn hết hạn, tự dọn (không gửi gì).

## Thiết kế kỹ thuật
- **Route mới** (`server.js` + `lib/payment.js`):
  - `POST /api/bao-gia-thi-cong` — validate như `/api/submit` (multer, rate-limit riêng),
    lưu order pending + file đính kèm vào `Private/orders/<mã>/`, trả `{ma, qrUrl, soTien, noiDung}`.
  - `POST /api/thanh-toan/webhook` — CHỈ chấp nhận từ provider: xác minh HMAC/secret trong
    header, idempotent (đơn đã paid thì bỏ qua), khớp `noiDung`↔mã đơn + số tiền ≥ phí.
  - `GET /api/thanh-toan/trang-thai/:ma` — public, chỉ trả `{status}` (pending/paid/expired).
- **Bí mật** trong `.env`: `SEPAY_WEBHOOK_SECRET` (hoặc `PAYOS_*`), `PAID_QUOTE_FEE`,
  `BANK_ACCOUNT_*` — thêm vào `.env.example`; backup 08:00 đã bao gồm `.env` + `Private/`.
- **VietQR ảnh**: dựng URL chuẩn img.vietqr.io (bank + số TK + số tiền + nội dung) — không cần
  thư viện; hoặc dùng QR provider trả về.
- **Email**: tái dùng `lib/mailer.js` (thêm cờ `paid` → subject "[Sunwa Design] BÁO GIÁ THI CÔNG
  (ĐÃ THANH TOÁN …đ) — tên (SĐT)").
- **Frontend** (`bao-gia.html` + `main.js`): hai thẻ chọn luồng trên đầu form; luồng phí render
  màn QR + poll; giữ nguyên validate hiện có.
- **Admin**: thêm mục "Đơn báo giá đã thanh toán" trong `/quan-tri` (đọc `Private/orders/`) —
  tiện đối soát; kèm nút đánh dấu hoàn tiền/khiếu nại (ghi chú thủ công).

## Bảo mật & vận hành
- Webhook đi qua tunnel công khai → BẮT BUỘC xác minh chữ ký/secret; từ chối nếu thiếu.
- Không bao giờ tin số liệu từ client: phí đọc từ `.env`, đối chiếu số tiền từ webhook.
- Đơn pending có TTL; job dọn trong health check hằng ngày (xoá order quá 7 ngày chưa paid).
- Rủi ro khách chuyển sai nội dung CK → không auto-khớp: admin panel cần nút "khớp tay"
  (nhập mã đơn + mã giao dịch) — ghi rõ trong phần admin ở trên.
- Health check thêm bước: webhook endpoint trả 401 khi thiếu chữ ký (chứng tỏ guard sống).

## Checklist triển khai (khi bắt đầu làm)
1. Chốt phí + ngân hàng; đăng ký SePay (hoặc PayOS), lấy key/secret, khai webhook URL.
2. `lib/payment.js` + routes + `.env` keys; test webhook bằng payload mẫu của provider.
3. UI hai luồng trên `/bao-gia`; poll trạng thái; màn hình QR.
4. Admin: danh sách đơn + khớp tay.
5. Test end-to-end bằng giao dịch thật số tiền nhỏ (1.000đ) trước khi đặt phí thật.
