# 🏢 Báo Cáo & Tài Liệu Tổng Hợp Phân Quyền (4 Roles) System SmartOffice

Tài liệu này tổng hợp toàn bộ **4 Phân quyền người dùng (Roles)** trong hệ thống Quản lý Văn phòng thông minh Multi-Tenant SaaS **SmartOffice**, mô tả phạm vi quản lý, danh sách chức năng chi tiết và quy trình vận hành của từng role.

---

## 📌 Tổng Quan Kiến Trúc Phân Quyền (RBAC)

Hệ thống được thiết kế theo mô hình **Multi-Tenant SaaS (Đa doanh nghiệp thuê)** gồm 4 cấp độ phân quyền rõ ràng:

```
+-------------------------------------------------------------+
| 1. Super Admin (Platform Owner)                             |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 2. Tenant Admin (Enterprise Admin)                          |
+-------------------------------------------------------------+
               |                               |
               v                               v
+------------------------------+ +----------------------------+
| 3. Manager (Approver)        | | 4. Employee (End User)     |
+------------------------------+ +----------------------------+
```

---

## 1️⃣ Super Admin (Chủ Nền Tảng - Platform Owner)

* **Phạm vi quản lý:** Toàn bộ Nền tảng SaaS (Toàn bộ các Doanh nghiệp thuê).
* **Đối tượng:** Ban quản trị hệ thống SmartOffice.
* **Giao diện Portal:** `/dashboard/super-admin` và các sub-pages.

### 🛠️ Danh sách Chức năng Chi tiết:
1. **Bảng Điều Khiển Tổng Quan Platform (Super Admin Dashboard):**
   - Theo dõi tổng số **Doanh nghiệp đang thuê (Tenants)** trên toàn nền tảng.
   - Thống kê tổng số lượng **Users** (Nhân sự) đang hoạt động toàn sàn.
   - Thống kê doanh thu **MRR (Monthly Recurring Revenue)** và **ARR (Annual Recurring Revenue)**.
   - Theo dõi nhanh **3 Giao dịch nạp tiền mới nhất** (Audit Log).

2. **Quản Lý Doanh Nghiệp Thuê (Tenants Management):**
   - **Tạo mới Doanh nghiệp (Manual Onboarding):** Khởi tạo công ty mới, thiết lập Subdomain độc lập (ví dụ: `fifa.smartoffice.com`), tạo tài khoản Admin ban đầu và gán gói cước.
   - **Khóa / Mở khóa Doanh nghiệp:** Chuyển trạng thái giữa `active` và `suspended` để tạm dừng hoặc khôi phục hoạt động của doanh nghiệp khi có vi phạm hoặc hết hạn cước.
   - **Nâng / Hạ gói cước thủ công:** Cập nhật gói cước (`free`, `premium`, `enterprise`) cho từng doanh nghiệp.

3. **Quản Lý Gói Cước SaaS (Subscription Plans Management - `/dashboard/plans`):**
   - **Tạo & Chỉnh sửa Gói Cước:** Thiết lập tên gói, mã gói (`code`), giá niêm yết (`price` $/tháng).
   - **Cấu hình Hạn ngạch (Quotas):** 
     - Giới hạn số lượng User tối đa (`maxUsers`: ví dụ Free = 20, Premium = 100, Enterprise = -1 là không giới hạn).
     - Giới hạn số lượng Tài nguyên tối đa (`maxResources`: ví dụ 5, 25, -1).
   - **Danh sách Tính năng Bao gồm:** Khai báo danh sách các tính năng được mở khóa trong từng gói.

4. **Thống Kê Doanh Thu & Nhật Ký Giao Dịch (`/dashboard/revenue`):**
   - **Thống kê Tài chính:** Doanh thu tháng này, Tổng doanh thu tích lũy toàn sàn (VND / USD).
   - **Nhật ký Nạp tiền MoMo Sandbox:** Quản lý lịch sử nạp tiền/gia hạn gói qua cổng **Ví MoMo Sandbox**.
   - **Tìm kiếm & Phân trang:** Tìm giao dịch theo Mã ref, lọc theo trạng thái (`success/pending/failed`), phân trang và kết xuất dữ liệu.

5. **Mô Phỏng Quẹt Cửa Kiểm Soát Ra Vào (`/door-simulator`):**
   - Kiểm thử tính năng quẹt thẻ RFID/NFC ảo cho tất cả doanh nghiệp trên toàn hệ thống.

---

## 2️⃣ Tenant Admin (Quản Trị Viên Doanh Nghiệp - Enterprise Admin)

* **Phạm vi quản lý:** Trong nội bộ 1 Doanh nghiệp (Tenant-level).
* **Đối tượng:** Ban Giám đốc, Trưởng phòng Hành chính / IT của Doanh nghiệp mua gói.
* **Giao diện Portal:** `/dashboard/admin` và các sub-pages.

### 🛠️ Danh sách Chức năng Chi tiết:
1. **Theo Dõi Hạn Gói Cước & Gia Hạn Qua MoMo:**
   - Widgets hiển thị tên Gói cước đang dùng (`currentPlan`), ngày hết hạn (`expiryDate`) và **Số ngày còn lại (`daysRemaining`)**.
   - **Cảnh báo hết hạn tự động:** Nếu gói cước hết hạn (`daysRemaining === 0`), giao diện sẽ hiển thị Banner đỏ `🚨 ĐÃ HẾT HẠN (TẠM KHÓA)`.
   - **Gia hạn / Nâng cấp gói qua MoMo:** Cho phép chọn số tháng (3, 6, 12 tháng) và thanh toán tự động qua Ví MoMo Sandbox để mở khóa hệ thống.

2. **Quản Lý Nhân Sự Nội Bộ (`/dashboard/users`):**
   - Thêm mới, chỉnh sửa, xóa tài khoản Nhân viên (`Employee`) và Quản lý (`Manager`).
   - Phân quyền người dùng trong công ty.
   - Theo dõi số lượng User đã dùng so với Hạn ngạch gói cước (`usersCount / maxUsers`).

3. **Quản Lý Cơ Sở Vật Chất / Tài Nguyên (`/dashboard/resources`):**
   - **Tạo & Quản lý Phòng họp (Rooms):** Thiết lập tên phòng, vị trí (Tầng), sức chứa, trang thiết bị đi kèm (Máy chiếu, TV,...).
   - **Quản lý Thiết bị mượn (Equipment):** Khai báo máy ảnh 4K, Laptop, Micro không dây, thiết bị đo,...
   - **Quản lý Xe công tác (Vehicles):** Xe Sedan, Xe 7 chỗ đưa đón đối tác.
   - Phê duyệt trực tiếp đơn hoặc cấu hình phê duyệt qua Manager.

4. **Báo Cáo & Thống Kê Doanh Nghiệp (`/dashboard/analytics`):**
   - Báo cáo tần suất sử dụng phòng họp, tỷ lệ mượn thiết bị và xe công tác trong doanh nghiệp.

5. **Quản lý Đặt Lịch Toàn Công Ty:**
   - Theo dõi live stream toàn bộ đơn đặt lịch của nhân viên trong công ty.

---

## 3️⃣ Manager (Trưởng Phòng / Quản Lý Phê Duyệt - Department Manager)

* **Phạm vi quản lý:** Phòng ban / Các đơn đặt lịch cần phê duyệt.
* **Đối tượng:** Trưởng phòng, Quản lý bộ phận.
* **Giao diện Portal:** `/dashboard/manager` và `/dashboard`.

### 🛠️ Danh sách Chức năng Chi tiết:
1. **Phê Duyệt Đơn Đặt Lịch (Booking Approval Center):**
   - Xem danh sách các đơn đăng ký mượn Phòng họp VIP, Xe công tác hoặc Thiết bị đắt tiền từ Nhân viên trong bộ phận.
   - **Duyệt đơn (`Approved`):** Xác nhận cho phép nhân viên sử dụng tài nguyên.
   - **Từ chối đơn (`Rejected`):** Nhập lý do từ chối để thông báo lại cho nhân viên.

2. **Cảnh Báo Quá Hạn Trả Thiết Bị (Overdue Equipment Alert):**
   - Nhận thông báo tự động từ Hệ thống CronJob khi nhân viên dưới quyền mượn thiết bị nhưng trễ hạn chưa mang trả về kho.

3. **Theo Dõi Lịch Bận Bộ Phận:**
   - Xem lịch trống/bận của các tài nguyên phòng họp để sắp xếp lịch họp phòng ban hợp lý.

---

## 4️⃣ Employee (Nhân Viên Doanh Nghiệp - End User)

* **Phạm vi quản lý:** Cá nhân nhân viên.
* **Đối tượng:** Toàn thể nhân viên trong Doanh nghiệp.
* **Giao diện Portal:** `/dashboard/employee` và `/dashboard/my-bookings`.

### 🛠️ Danh sách Chức năng Chi tiết:
1. **Đăng Ký Đặt Phòng & Thiết Bị (Resource Booking):**
   - **Kiểm tra Lịch trống (Real-time Availability):** Xem khung giờ còn trống trong ngày (khung giờ làm việc 08:00 - 17:30).
   - **Tạo đơn đặt lịch:** Đăng ký phòng họp (kèm danh sách người tham gia), mượn thiết bị hoặc xe công tác kèm ghi chú mục đích.

2. **Quản Lý Lịch Sử Đặt Lịch Cá Nhân (`/dashboard/my-bookings`):**
   - Xem danh sách các đơn đã đặt, trạng thái phê duyệt (`Pending`, `Approved`, `Rejected`, `Checked_in`, `Returned`).
   - **Check-in / Trả thiết bị:** Thao tác xác nhận đã nhận phòng/thiết bị và bấm hoàn trả khi dùng xong.
   - **Hủy đơn:** Hủy các đơn đang chờ duyệt nếu thay đổi kế hoạch.

3. **Hệ Thống Thông Báo Thời Gian Thực (Real-time Notifications):**
   - Nhận thông báo chuông trên trang web và Email khi đơn đặt lịch được Manager duyệt/từ chối.
   - Nhận nhắc nhở cảnh báo khi sắp đến giờ họp hoặc trễ hạn trả thiết bị.

4. **Mô Phỏng Thẻ Quẹt Cửa Điện Tử (Smart Door Pass):**
   - Sử dụng mã quẹt thẻ điện tử được cấp để mô phỏng mở cửa phòng họp đã đăng ký.

---

## 📊 Bảng So Sánh Quyền Hạn (Matrix Permission)

| Chức năng | Super Admin | Tenant Admin | Manager | Employee |
| :--- | :---: | :---: | :---: | :---: |
| **Quản lý Doanh nghiệp & Subdomain** | 🟢 Tất cả | ❌ Không | ❌ Không | ❌ Không |
| **Quản lý & Tạo Gói cước SaaS** | 🟢 Tất cả | ❌ Không | ❌ Không | ❌ Không |
| **Xem Doanh thu Platform (MoMo)** | 🟢 Tất cả | ❌ Không | ❌ Không | ❌ Không |
| **Gia hạn gói cước Doanh nghiệp qua MoMo** | ❌ Không | 🟢 Xem & Gia hạn | ❌ Không | ❌ Không |
| **Quản lý Nhân sự Công ty (Users)** | 👁️ Xem tất cả | 🟢 Thêm/Sửa/Xóa | ❌ Không | ❌ Không |
| **Quản lý Cơ sở vật chất (Resources)** | 👁️ Xem tất cả | 🟢 Thêm/Sửa/Xóa | ❌ Không | ❌ Không |
| **Phê duyệt Đơn đặt lịch** | 👁️ Xem | 🟢 Duyệt tất cả | 🟢 Duyệt | ❌ Không |
| **Tạo Đơn đặt lịch & Mượn thiết bị** | ❌ Không | 🟢 Tạo đơn | 🟢 Tạo đơn | 🟢 Tạo đơn |
| **Xem Lịch sử Đặt lịch cá nhân** | ❌ Không | 🟢 Tất cả | 🟢 Cá nhân | 🟢 Cá nhân |

---

## ⚡ Các Luồng Tự Động Hóa Hệ Thống (Automated Workflows)

1. **Luồng Thanh toán & Gia hạn gói cước MoMo:**
   `Tenant Admin` chọn gói (3/6/12 tháng) -> `MoMo Payment Gateway` -> `paymentController.verifyMomoReturn` -> Tự động tính toán & cập nhật `tenant.planExpiredAt` -> Mở khóa hệ thống.

2. **Luồng Tự động Tạm khóa khi Hết hạn (Auto-Suspension):**
   `cronService` (chạy mỗi 60s) kiểm tra `tenant.planExpiredAt < Now` -> Đổi `tenant.status = 'suspended'` -> `authMiddleware.checkSubscriptionStatus` tự động chặn các thao tác tạo mới/sửa/xóa của nhân viên doanh nghiệp đó cho đến khi gia hạn.

3. **Luồng Cảnh báo Trễ hạn Thiết bị (Overdue Alert):**
   `cronService` kiểm tra các đơn mượn thiết bị quá hạn `endTime` -> Tự động gửi thông báo Quả chuông & Email nhắc nhở đến Nhân viên và Manager.
