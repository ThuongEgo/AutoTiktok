# Auto Tiktok

Extension Chrome giúp tự động hóa một số thao tác trên TikTok như quét danh sách người dùng, thả tim, bình luận và theo dõi theo lô.

## Tinh nang chinh

- Quet du lieu:
  - Quet nguoi theo doi / dang theo doi cua 1 tai khoan.
  - Quet theo hashtag.
  - Quet nguoi da binh luan tren video.
- Auto Like:
  - Thao tac theo hashtag hoac theo danh sach nguoi dung.
  - Chon che do tha tim hoac bo tim.
  - Cai dat do tre ngau nhien toi thieu/toi da.
- Auto Comment:
  - Binh luan theo hashtag hoac danh sach nguoi dung.
  - Quan ly danh sach comment (them tay, import file TXT, xoa).
  - Tuy chon tha tim kem theo khi binh luan.
- Bulk Follow:
  - Theo doi hoac huy theo doi theo lo tu danh sach.
- User List:
  - Them user thu cong.
  - Import/Export danh sach user bang file TXT.
  - Copy nhanh vao clipboard.
- Giao dien Side Panel:
  - Mo nhanh trong side panel hoac popup window rieng.

## Yeu cau

- Google Chrome phien ban moi (ho tro Manifest V3).
- Da dang nhap tai khoan TikTok tren trinh duyet.
- Quyen extension:
  - `activeTab`
  - `storage`
  - `downloads`
  - `sidePanel`
- Host permissions:
  - `https://www.tiktok.com/*`
  - `https://tiktok.com/*`

## Cai dat (developer mode)

1. Tai hoac clone source code ve may.
2. Mo Chrome va vao `chrome://extensions/`.
3. Bat **Developer mode**.
4. Chon **Load unpacked**.
5. Tro den thu muc du an `AutoTiktok`.
6. Bam vao icon extension de mo side panel va bat dau su dung.

## Cach su dung nhanh

1. Mo TikTok tren Chrome (extension se uu tien URL co `?lang=en`).
2. Mo giao dien `Auto Tiktok`.
3. Chon tab chuc nang:
   - `Quet`: thu thap user.
   - `Tha tim`: thao tac like/unlike.
   - `Binh luan`: cau hinh noi dung va chay comment.
   - `Theo doi`: follow/unfollow theo lo.
   - `Danh sach`: quan ly nguoi dung muc tieu.
4. Dat gioi han va do tre phu hop.
5. Bam **Bat dau** de chay, dung nut **Dung** khi can.

## Cau hinh

Tat ca cau hinh trung tam nam trong file `config.js`:

- `LIMITS`:
  - `maxLikes`
  - `maxComments`
  - `maxFollow`
  - `runtimeFreeLimit`

Vi du:

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

## Cau truc thu muc

- `manifest.json`: cau hinh extension (MV3).
- `background.js`: service worker + khoi tao storage.
- `content.js`: script chay tren trang TikTok.
- `popup.html` / `popup.js` / `popup.css`: giao dien va logic dieu khien.
- `content.css`: style bo sung tren trang TikTok.
- `config.js`: bien cau hinh toan cuc.

## Luu y quan trong

- Cong cu nay khong phai san pham chinh thuc cua TikTok.
- Viec tu dong hoa co the vi pham dieu khoan su dung cua nen tang.
- Nen dung do tre hop ly, han che tan suat cao de giam rui ro khoa tai khoan.
- Chi su dung tren tai khoan va du lieu ban co quyen truy cap.

## Phat trien tiep

- Bo sung trang cai dat rieng (options page).
- Them logging chi tiet va file report ket qua.
- Them bo loc user thong minh truoc khi auto follow/comment.
