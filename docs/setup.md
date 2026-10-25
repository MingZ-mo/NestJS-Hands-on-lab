# Hướng dẫn Cài đặt & Khởi chạy — Hands-on Lab

Tài liệu này hướng dẫn bạn chuẩn bị môi trường, làm quen với cấu trúc thư mục và khởi chạy dự án nền (*starter project*) của bài lab.

---

## 1. Yêu cầu môi trường

Để đảm bảo các đoạn code và bộ test hoạt động trơn tru nhất, bạn cần chuẩn bị:

* **Node.js:** Phiên bản `18.x`, `20.x` hoặc `22.x LTS` (khuyến nghị Node 20+). Kiểm tra bằng lệnh:
  ```bash
  node -v
  ```
* **Trình quản lý gói:** `pnpm` hoặc `npm`.
* **Công cụ gửi HTTP request:** cURL (có sẵn trên Terminal/PowerShell), Postman, Thunder Client hoặc REST Client trên VSCode.

> [!NOTE]
> Để giữ thời lượng thực hành trong **30–45 phút**, dự án nền này sử dụng **In-memory Repository** (lưu dữ liệu tạm thời trong bộ nhớ RAM). Bạn **không cần** cài đặt Docker hay PostgreSQL, giúp loại bỏ hoàn toàn các lỗi kết nối phức tạp để bạn tập trung trọn vẹn 100% vào cơ chế Request Lifecycle!

---

## 2. Cấu trúc thư mục của Hands-on Lab

Bộ tài liệu và mã nguồn được sắp xếp bài bản theo cấu trúc sau:

```text
nestjs-hands-on-lab/
├── README.md                           # Hướng dẫn tổng quan bài Lab & Rubric D0-D3
├── docs/                               # Tài liệu học tập & lý thuyết
│   ├── learning-objectives.md          # Mục tiêu học tập cần đạt
│   ├── setup.md                        # Hướng dẫn cài đặt & khởi chạy (tệp này)
│   ├── request-lifecycle.md            # Giải thích cơ chế Request Lifecycle chuyên sâu
│   └── troubleshooting.md              # Cẩm nang xử lý các lỗi thường gặp
├── steps/                              # Hướng dẫn thực hành từng bước
│   ├── step-1-guard.md                 # Bước 1: Xây dựng Custom Auth Guard
│   ├── step-2-interceptor.md           # Bước 2: Xây dựng Logging & Transform Interceptors
│   └── step-3-exception-filter.md      # Bước 3: Xây dựng Global Exception Filter
├── starter/                            # MÃ NGUỒN KHỞI ĐẦU DÀNH CHO BẠN
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── todos/                      # Module Todos đã dựng sẵn nghiệp vụ
│       └── common/                     # NƠI BẠN TỰ HOÀN THIỆN CODE (CÓ CHÚ THÍCH TODO)
│           ├── guards/auth.guard.ts
│           ├── interceptors/logging.interceptor.ts
│           ├── interceptors/transform.interceptor.ts
│           └── filters/http-exception.filter.ts
├── solution/                           # MÃ NGUỒN LỜI GIẢI ĐỐI CHIẾU HOÀN CHỈNH
│   ├── README.md                       # Phân tích & giải thích chi tiết đáp án
│   └── src/                            # Code mẫu đã hoàn thiện 100%
└── tests/                              # BỘ TEST TỰ ĐỘNG END-TO-END (E2E)
    └── request-lifecycle.e2e-spec.ts   # Kiểm chứng 6 kịch bản T01-T06
```

---

## 3. Khởi chạy dự án nền (Starter)

Dự án có thể chạy trực tiếp bằng cách sử dụng các dependency đã có sẵn trong workspace hoặc cài đặt độc lập:

### Bước 1: Mở thư mục bài lab
Mở terminal và trỏ tới thư mục bài lab:
```bash
cd nestjs-hands-on-lab/starter
```

### Bước 2: Cài đặt dependency (nếu chạy độc lập)
Nếu bạn copy thư mục này ra một nơi khác ngoài repo cha:
```bash
npm install
```

### Bước 3: Khởi động server ở chế độ watch
```bash
npm run start:dev
```
Khi thấy dòng log sau xuất hiện trên console, server NestJS đã sẵn sàng lắng nghe ở cổng 3000:
```text
[NestApplication] Nest application successfully started +5ms
```

---

## 4. Danh sách API Endpoint có sẵn để thực hành

Module `Todos` được cung cấp sẵn các route sau:

| Method | Endpoint | Mô tả | Trạng thái ban đầu |
| :--- | :--- | :--- | :--- |
| `GET` | `/todos` | Lấy danh sách tất cả công việc | Thành công (200) |
| `GET` | `/todos/:id` | Lấy chi tiết công việc theo ID | Trả về 404 nếu ID không tồn tại |
| `POST` | `/todos` | Tạo mới một công việc | Nhận body `{ title, description }` |
| `GET` | `/todos/slow-endpoint` | Giả lập tác vụ chậm (delay 300ms) | Dùng để kiểm chứng Interceptor đo giờ |
| `GET` | `/todos/trigger-error` | Giả lập lỗi server không kiểm soát (`throw new Error`) | Dùng để kiểm chứng Exception Filter |

---

## 5. Dữ liệu mẫu khởi đầu (Initial In-memory State)

Hệ thống được khởi tạo sẵn với 2 todo mẫu:
1. `id = 1`: `title = "Học NestJS Request Lifecycle"`, `status = "IN_PROGRESS"`
2. `id = 2`: `title = "Làm bài tập Hands-on Lab"`, `status = "OPEN"`

---

## 6. Lệnh kiểm thử nhanh với cURL

Bạn có thể mở một cửa sổ Terminal thứ hai để gửi thử request:

```bash
# 1. Lấy danh sách todos
curl http://localhost:3000/todos

# 2. Lấy todo theo ID
curl http://localhost:3000/todos/1

# 3. Tạo một todo mới
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Viết Custom Guard\", \"description\": \"Thực hành bước 1\"}"
```

Khi dự án nền đã chạy tốt, bạn chuyển sang đọc tài liệu [request-lifecycle.md](request-lifecycle.md) rồi mở [../steps/step-1-guard.md](../steps/step-1-guard.md) để bắt đầu bước đầu tiên!
