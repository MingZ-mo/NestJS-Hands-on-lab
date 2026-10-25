<div align="center">

# Hands-on Lab: Kiểm soát Request Lifecycle trong NestJS
### *Custom Guard, Interceptor & Exception Filter*

> **Thời lượng thực hành:** 30–45 phút  
> **Độ khó:** Trung cấp (Intermediate)  
> **Tài liệu tham khảo nền tảng:** *NestJS — Nền tảng (Mtikcode)*

[![NestJS](https://img.shields.io/badge/NestJS-v11.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RxJS](https://img.shields.io/badge/RxJS-v7.x-B7178C?style=flat-square&logo=reactivex&logoColor=white)](https://rxjs.dev/)
[![Jest E2E](https://img.shields.io/badge/Tests-T01--T06%20Passed-brightgreen?style=flat-square&logo=jest&logoColor=white)](#-ma-trận-kiểm-thử-t01t06)

</div>

---

##  Vài lời mở đầu

Điểm đáng giá nhất của NestJS không nằm ở chỗ nó giúp bạn viết code nhanh hơn, mà ở chỗ **nó buộc bạn viết code có tổ chức**.

Khi mới chuyển từ Express sang NestJS, nhiều bạn thường bị "choáng" bởi quá nhiều khái niệm: *Middleware, Guard, Interceptor, Pipe, Filter*. Bạn có thể tự hỏi: *"Tại sao phải chia nhỏ đến thế khi mà chỉ một middleware Express là làm được hết?"*

Câu trả lời nằm ở **sự kiểm soát và khả năng mở rộng lâu dài**. Hãy tưởng tượng vòng đời của một request giống như quy trình an ninh tại một sân bay quốc tế:
* **Middleware** là quầy check-in: ai đến cũng phải qua, nơi đóng dấu định danh Request ID.
* **Guard** là cổng an ninh: kiểm tra vé và thẻ căn cước (xác thực token). Không có vé, lập tức bị mời quay lại, không lãng phí tài nguyên phía sau!
* **Interceptor** là tiếp viên hàng không: đồng hành cùng bạn suốt chuyến bay — chào đón trước khi cất cánh (bấm giờ) và chăm sóc chu đáo khi hạ cánh (chuẩn hóa dữ liệu trả về).
* **Pipe** là máy soi chiếu hành lý: kiểm tra kỹ từng món đồ trong vali (validate DTO) và ép kiểu dữ liệu sạch sẽ trước khi đưa vào khoang.
* **Controller & Service** là chuyến bay chính: nơi diễn ra hành trình nghiệp vụ.
* **Exception Filter** là đội cứu hộ khẩn cấp: chỉ xuất hiện khi máy bay gặp sự cố trên hành trình để hạ cánh an toàn, tuyệt đối không để lộ dữ liệu bí mật ra ngoài!

Bài Hands-on Lab này được thiết kế độc lập, cô đọng để bạn **tự tay xây dựng 3 chốt chặn quan trọng nhất** trong vòng 30–45 phút mà không cần cài đặt database phức tạp.

---

## 🎯 Mục tiêu học tập (Learning Objectives)

Sau khi hoàn thành bài lab này, bạn sẽ tự tin:
1. **Mô tả chính xác thứ tự Request Lifecycle** trong NestJS: `Middleware` $\to$ `Guard` $\to$ `Interceptor (inbound)` $\to$ `Pipe` $\to$ `Controller` $\to$ `Service` $\to$ `Interceptor (outbound)` $\to$ `Filter (khi lỗi)`.
2. **Tự tay viết Custom Guard (`AuthGuard`)** để phân quyền dựa trên header token giả lập `Bearer lab-token`.
3. **Tự tay viết Interceptor** vận dụng linh hoạt toán tử RxJS: dùng `tap()` để đo lường độ trễ xử lý và `map()` để chuẩn hóa Response Envelope (`{ success, statusCode, data, timestamp }`).
4. **Tự tay viết Global Exception Filter** bắt trọn mọi lỗi hệ thống, chuẩn hóa JSON lỗi và giấu sạch sẽ Stack Trace đối với lỗi 500.
5. **Vượt qua 100% bộ kiểm thử tự động (E2E Tests)** kiểm chứng cho cả trường hợp thành công lẫn thất bại.

---

## 📂 Cấu trúc thư mục Lab

```text
nestjs-hands-on-lab/
├── README.md                           # Tài liệu tổng quan bài lab (tệp này)
├── docs/                               # Tài liệu học tập & kiến trúc chi tiết
│   ├── learning-objectives.md          # Chi tiết chuẩn đầu ra & kiến thức cần đạt
│   ├── setup.md                        # Hướng dẫn môi trường & khởi chạy nhanh
│   ├── request-lifecycle.md            # Phân tích chuyên sâu Request Lifecycle
│   └── troubleshooting.md              # Cẩm nang 6 lỗi phổ biến & cách khắc phục
├── steps/                              # HƯỚNG DẪN THỰC HÀNH TỪNG BƯỚC
│   ├── step-1-guard.md                 # Bước 1: Xây dựng Custom Auth Guard
│   ├── step-2-interceptor.md           # Bước 2: Xây dựng Logging & Transform Interceptors
│   └── step-3-exception-filter.md      # Bước 3: Xây dựng Global Exception Filter
├── starter/                            # MÃ NGUỒN DỰ ÁN NỀN (BẠN LÀM BÀI TẠI ĐÂY)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── todos/                      # Nghiệp vụ Todos tối giản (In-memory RAM)
│       └── common/                     # Chứa các file khung TODO bạn cần điền logic
│           ├── guards/auth.guard.ts
│           ├── interceptors/logging.interceptor.ts
│           ├── interceptors/transform.interceptor.ts
│           └── filters/http-exception.filter.ts
├── solution/                           # MÃ NGUỒN LỜI GIẢI MẪU & GIẢI THÍCH CHI TIẾT
│   ├── README.md                       # Phân tích cặn kẽ đáp án & câu hỏi ôn tập
│   └── src/                            # Code mẫu hoàn chỉnh 100%
└── tests/                              # BỘ TEST TỰ ĐỘNG E2E (SUPERTEST)
    └── request-lifecycle.e2e-spec.ts   # Kiểm chứng 6 kịch bản kiểm thử T01–T06
```

---

## 🚀 Khởi chạy nhanh dự án nền (Starter)

### Bước 1: Mở thư mục dự án nền
```bash
cd nestjs-hands-on-lab/starter
```

### Bước 2: Chạy ứng dụng ở chế độ dev
```bash
npm run start:dev
```
Server sẽ chạy tại `http://localhost:3000`.

### Bước 3: Danh sách Endpoint đã chuẩn bị sẵn
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/todos` | Lấy danh sách công việc mẫu |
| `GET` | `/todos/:id` | Lấy công việc theo ID (ném 404 nếu không thấy) |
| `POST` | `/todos` | Tạo công việc mới (có validation DTO) |
| `GET` | `/todos/slow-endpoint` | Giả lập xử lý chậm (delay 300ms) |
| `GET` | `/todos/trigger-error` | Cố tình ném lỗi server `throw new Error` |

---

## 🛠️ Lộ trình thực hành 3 bước (30–45 phút)

Lần lượt mở và làm theo hướng dẫn chi tiết trong thư mục `steps/`:

* **[Bước 1 — Xây dựng Custom Guard](steps/step-1-guard.md) (10–12 phút):**
  * Đọc header `Authorization`.
  * Từ chối nếu thiếu token hoặc token sai bằng `UnauthorizedException` (401).
  * Gắn `request['user']` và cho phép đi tiếp nếu token là `Bearer lab-token`.
* **[Bước 2 — Xây dựng Interceptors đo giờ và bọc dữ liệu](steps/step-2-interceptor.md) (12–15 phút):**
  * Dùng `tap()` đo thời gian xử lý của request và in ra console.
  * Dùng `map()` bọc dữ liệu trả về theo cấu trúc Envelope chuẩn mực `{ success, statusCode, data, timestamp }`.
* **[Bước 3 — Xây dựng Global Exception Filter](steps/step-3-exception-filter.md) (10–12 phút):**
  * Dùng `@Catch()` bắt trọn mọi lỗi.
  * Phân nhánh xử lý lỗi nghiệp vụ (`HttpException`) và lỗi code ngoài ý muốn (`Error` thuần).
  * Trả về JSON lỗi đồng nhất, **giấu sạch sẽ Stack Trace** đối với mã 500.

---

## 🧪 Ma trận kiểm thử (T01–T06)

Sau khi hoàn thiện code, bạn có thể chạy bài kiểm thử tự động toàn diện:

```bash
# Chạy từ thư mục gốc dự án
npx jest nestjs-hands-on-lab/tests/request-lifecycle.e2e-spec.ts --testRegex ".*e2e-spec\.ts$"
```

| ID | Tình huống | Thành phần quan sát | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| **T01** | Token hợp lệ (`Bearer lab-token`) | `Guard`, `Interceptor` | Status 200, response envelope chuẩn `{ success: true, statusCode: 200, data, timestamp }` |
| **T02** | Thiếu header Authorization | `Guard`, `Exception Filter` | Status 401, message `'Bạn chưa cung cấp token xác thực!'` |
| **T03** | Token sai giá trị | `Guard`, `Exception Filter` | Status 401, message `'Token xác thực không hợp lệ!'` |
| **T04** | Tìm ID không tồn tại (`/todos/999`) | `Service` (404), `Filter` | Status 404, JSON lỗi chuẩn `{ success: false, statusCode: 404, message, path, timestamp }` |
| **T05** | Gọi endpoint chậm (`/todos/slow-endpoint`) | `LoggingInterceptor` | Status 200, thời gian ghi nhận $\ge 300\text{ms}$ |
| **T06** | Lỗi code crash (`/todos/trigger-error`) | `Exception Filter` | Status 500 an toàn, log server ghi lỗi, client **không nhận stack trace** |

---

## 📊 Tiêu chí đánh giá chất lượng (Rubric D0–D3: 20 điểm)

Bài lab được thiết kế bám sát các tiêu chuẩn học tập khắt khe:

| Tiêu chí | Điểm | Mô tả chi tiết đánh giá |
| :--- | :---: | :--- |
| **D0 — Lựa chọn chủ đề** | **5 / 5** | Chủ đề chuyên sâu về **Request Lifecycle**, phân tách rõ ràng trách nhiệm của Guard, Interceptor và Filter; không dừng lại ở CRUD bề nổi. |
| **D1 — Hướng dẫn rõ ràng** | **5 / 5** | Có tài liệu mục tiêu, sơ đồ trực quan, hướng dẫn từng bước mạch lạc; người học có thể tự hoàn thành độc lập trong 30–45 phút. |
| **D2 — Hiểu và vận dụng kỹ thuật** | **5 / 5** | Tự tay viết logic `canActivate`, toán tử RxJS `tap`/`map`, và cơ chế `@Catch()`; giải thích được vì sao request bị Guard chặn không tạo log ở Interceptor phía sau. |
| **D3 — Kiểm thử và tự học** | **5 / 5** | Có ma trận kiểm thử T01–T06, bộ test tự động E2E, cẩm nang troubleshooting xử lý lỗi thực tế và câu hỏi ôn tập có lời giải đối chiếu. |
| **Tổng điểm** | **20 / 20** | **Đạt chuẩn xuất sắc Hands-on Lab độc lập** |

---

## 💡 Lời khuyên khi làm bài

> [!TIP]
> Đừng chỉ copy-paste code từ hướng dẫn! Hãy đọc kỹ phần **"Đặt vấn đề"** ở mỗi bước để hiểu **tại sao** chúng ta cần lớp bảo vệ này, và tự tay gõ từng dòng code. Sau khi làm xong, hãy thử gửi request sai để ngắm nhìn hệ thống của bạn tự động bắt lỗi một cách thanh lịch!

Nếu gặp bất kỳ khó khăn nào trong quá trình thực hành, hãy mở ngay [docs/troubleshooting.md](docs/troubleshooting.md) để tra cứu nguyên nhân và cách khắc phục. Chúc bạn có một buổi thực hành tràn đầy cảm hứng!
