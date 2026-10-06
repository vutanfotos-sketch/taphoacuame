# Máy tính tiền tạp hóa

App web tĩnh (PWA) tính tiền cho tiệm tạp hóa. Người dùng là người lớn tuổi, dùng iPhone 15
(Safari, thêm ra màn hình chính). Giao diện và chú thích code bằng tiếng Việt.

- Link chạy thật: https://vutanfotos-sketch.github.io/taphoacuame/
- Repo **public**: https://github.com/vutanfotos-sketch/taphoacuame

## Cách chạy

- Toàn bộ app nằm trong `index.html` (HTML + CSS + JS thuần, không thư viện, không CDN để chạy được khi mất mạng).
  `sw.js` là service worker (lưu sẵn app để mở khi mất mạng, tự nhận bản mới), `manifest.json` + `icon-*.png`, `apple-touch-icon.png` là phần PWA.
- Chạy thử trên máy: `python3 -m http.server 8123` rồi mở http://localhost:8123 (đã khai trong `.claude/launch.json`).
  Mở bằng `file://` thì service worker không chạy.
- Đưa lên mạng: push lên nhánh `main`, GitHub Pages tự build (~1 phút).
- **Mỗi lần sửa app phải tăng cùng lúc** `APP_VERSION` trong `index.html` và `CACHE = 'taphoa-vN'` trong `sw.js`
  (hai số luôn bằng nhau), nếu không điện thoại sẽ không nhận bản mới.

## Quy ước code

- JS kiểu cũ (`var`, `function`), tất cả nằm trong một IIFE `'use strict'`. Không thêm framework hay bước build.
- Dành cho người lớn tuổi: nút bấm tối thiểu 44px, chữ tối thiểu 16px, màu tương phản cao.
  Mọi thao tác xóa/thay dữ liệu phải có popup hỏi lại (`askConfirm`).
- Tiền: số nguyên đồng, hiển thị bằng `fmt()` (Intl `vi-VN` + "đ"). Tìm kiếm không dấu bằng `plain()`.
- Thử trên khung điện thoại 375×812. Thử xong phải xóa sạch localStorage và IndexedDB `taphoa`.
  Khi thử sao lưu, giả lập `navigator.share` / chặn `a.click()` để không tải file thật.

## Dữ liệu (chỉ nằm trên từng điện thoại)

- localStorage: `taphoa_products`, `taphoa_cart`, `taphoa_last_backup`, `taphoa_backup_pw`, `taphoa_order_keep_days`,
  `taphoa_shop` (`{ name }`: chỉ tên tiệm; chủ tiệm không muốn có địa chỉ và số điện thoại).
  `taphoa_settings` (`{ askCustomer }`: bật ghi tên khách, mặc định tắt vì tạp hóa không cần, tiệm đồ dùng cần),
  `taphoa_recent_customers` (tên khách gần đây, giữ cách viết đầu tiên), `taphoa_cart_customer` (khách của đơn đang tính,
  chọn trước khi chọn hàng).
- IndexedDB `taphoa` phiên bản 3: kho `photos` (khóa = id món, giá trị = ảnh data URL 400×400),
  kho `orders` (keyPath `ts`, lịch sử đơn, giữ 3 tháng–2 năm tùy chọn, mặc định 1 năm),
  kho `debts` (keyPath `ts`, sổ nợ `{ ts, customer, type: 'no'|'tra', amount, orderTs?, total?, paid? }`; nợ của khách = tổng `no` − tổng `tra`,
  gộp theo `plain(tên)`). Sổ nợ KHÔNG bị xóa theo thời gian giữ lịch sử.
- Đơn: `{ ts, items: [{ id, name, unit, unitName, qty, price, sub }], total, given, change, customer?, debt? }`
  (`debt` = phần ghi nợ; xóa/mở lại đơn có `debt` thì xóa luôn dòng `no` có `orderTs` trùng, trong cùng một giao dịch).
- Món: `{ id, name, price, unit?, units?: [{ name, price }], bulkMin?, bulkPrice? }`
  (`price`/`unit` = cách bán chính, `units` = cách bán khác như thùng/hộp, `bulk*` = giá sỉ cho cách bán chính).
- Giỏ: `[{ id, qty, unit? }]` (`unit` trống = cách bán chính).
- Món chủ tiệm tự thêm có id từ 21 (`FIRST_USER_ID`). id 1–20 là món mẫu của bản đầu, `SAMPLE_PRODUCTS` chỉ còn dùng để nhận ra món mẫu chưa sửa.

## Tuyệt đối không tự ý sửa (hỏi chủ tiệm trước)

- **Định dạng file sao lưu**: bản 2 mã hóa AES-GCM 256, khóa sinh bằng PBKDF2-SHA256 600.000 vòng,
  các trường `app, version, encrypted, cipher, kdf, iterations, salt, iv, data`; bên trong là
  `{ app, version: 1, createdAt, products, photos, shop?, orders?, orderKeepDays?, debts? }`. Khôi phục thì THAY món/ảnh,
  còn đơn đã bán và sổ nợ thì GỘP (không xóa dữ liệu đang có). Phải luôn khôi phục được
  cả file bản 2 lẫn file cũ bản 1 (chưa mã hóa). Đổi định dạng là các file sao lưu đã có sẽ không mở được.
- **Tên khóa localStorage, tên/phiên bản/kho IndexedDB và cấu trúc dữ liệu ở trên**: đổi mà không có đoạn chuyển đổi là mất dữ liệu trên điện thoại.
  Giữ nguyên đoạn chuyển đổi `packName/packSize` (bản 8) sang `units`.
- **Không bao giờ đưa dữ liệu tiệm, file sao lưu (`taphoa-saoluu-*`, đã có trong `.gitignore`) hay mật khẩu lên repo**, vì repo public.
- Không thêm lại việc tự nạp món mẫu cho máy mới (máy mới bắt đầu với danh sách trống).
- Không bỏ các popup hỏi lại trước khi xóa đơn, xóa món, khôi phục, rút ngắn thời gian lưu lịch sử.
- Đơn lưu vào lịch sử phải đi qua popup tiền thối (có `given`, `change`, `ts` chính xác). Nút "Đơn mới" chỉ
  cho 2 đường: đã bán → popup tiền thối, hoặc khách không mua → xóa không lưu.

## Việc đang để dành

- In hóa đơn qua máy in nhiệt AirPrint (Wi-Fi), tạm dừng tới khi chủ tiệm có máy in. Safari iPhone không in Bluetooth được.
