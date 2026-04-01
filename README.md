# Auto TikTok

Tiện ích Chrome giúp tự động hóa một số thao tác trên TikTok như quét danh sách người dùng, thả tim, bình luận và theo dõi theo lô.

## Tính năng chính

- Quét dữ liệu:
  - Quét người theo dõi/đang theo dõi của một tài khoản.
  - Quét theo hashtag.
  - Quét người đã bình luận trên video.
- Tự động thả tim (Auto Like):
  - Thao tác theo hashtag hoặc theo danh sách người dùng.
  - Chọn chế độ thả tim hoặc bỏ tim.
  - Cài đặt độ trễ ngẫu nhiên tối thiểu/tối đa.
- Tự động bình luận (Auto Comment):
  - Bình luận theo hashtag hoặc danh sách người dùng.
  - Quản lý danh sách comment (thêm tay, import file TXT, xóa).
  - Tùy chọn thả tim kèm theo khi bình luận.
- Theo dõi hàng loạt (Bulk Follow):
  - Theo dõi hoặc hủy theo dõi theo lô từ danh sách.
- Danh sách người dùng (User List):
  - Thêm người dùng thủ công.
  - Import/Export danh sách người dùng bằng file TXT.
  - Sao chép nhanh vào clipboard.
- Giao diện Side Panel:
  - Mở nhanh trong side panel hoặc popup window riêng.

## Yêu cầu

- Google Chrome phiên bản mới (hỗ trợ Manifest V3).
- Đã đăng nhập tài khoản TikTok trên trình duyệt.
- Quyền extension:
  - `activeTab`
  - `storage`
  - `downloads`
  - `sidePanel`
- Host permissions:
  - `https://www.tiktok.com/*`
  - `https://tiktok.com/*`

## Cài đặt (Developer Mode)

1. Tải hoặc clone source code về máy.
2. Mở Chrome và vào `chrome://extensions/`.
3. Bật **Developer mode**.
4. Chọn **Load unpacked**.
5. Trỏ đến thư mục dự án `AutoTiktok`.
6. Bấm vào icon extension để mở side panel và bắt đầu sử dụng.

## Cách sử dụng nhanh

1. Mở TikTok trên Chrome (extension sẽ ưu tiên URL có `?lang=en`).
2. Mở giao diện `Auto TikTok`.
3. Chọn tab chức năng:
   - `Quét`: thu thập người dùng.
   - `Thả tim`: thao tác like/unlike.
   - `Bình luận`: cấu hình nội dung và chạy comment.
   - `Theo dõi`: follow/unfollow theo lô.
   - `Danh sách`: quản lý người dùng mục tiêu.
4. Đặt giới hạn và độ trễ phù hợp.
5. Bấm **Bắt đầu** để chạy, dùng nút **Dừng** khi cần.

## Cấu hình

Tất cả cấu hình trung tâm nằm trong file `config.js`:

- `LIMITS`:
  - `maxLikes`
  - `maxComments`
  - `maxFollow`
  - `runtimeFreeLimit`

Ví dụ:

```js
const APP_CONFIG = {
  IS_PREMIUM: false,
  LIMITS: {
    maxLikes: 10000,
    maxComments: 10000,
    maxFollow: 10000,
    runtimeFreeLimit: 10000000,
  },
};
```

## Cấu trúc thư mục

- `manifest.json`: cấu hình extension (MV3).
- `background.js`: service worker + khởi tạo storage.
- `content.js`: script chạy trên trang TikTok.
- `popup.html` / `popup.js` / `popup.css`: giao diện và logic điều khiển.
- `content.css`: style bổ sung trên trang TikTok.
- `config.js`: biến cấu hình toàn cục.

## Lưu ý quan trọng

- Công cụ này không phải sản phẩm chính thức của TikTok.
- Việc tự động hóa có thể vi phạm điều khoản sử dụng của nền tảng.
- Nên dùng độ trễ hợp lý, hạn chế tần suất cao để giảm rủi ro khóa tài khoản.
- Chỉ sử dụng trên tài khoản và dữ liệu bạn có quyền truy cập.

## Phát triển tiếp

- Bổ sung trang cài đặt riêng (options page).
- Thêm logging chi tiết và file report kết quả.
- Thêm bộ lọc người dùng thông minh trước khi auto follow/comment.

## License

Dự án được phát hành theo giấy phép MIT.  
Copyright (c) 2026 thuongdq.
