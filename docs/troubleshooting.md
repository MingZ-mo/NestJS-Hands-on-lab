# Cẩm nang Xử lý sự cố (Troubleshooting Guide)

Trong quá trình thực hành và xây dựng Request Lifecycle trên NestJS, việc gặp lỗi là điều hoàn toàn tự nhiên. Bảng tra cứu dưới đây giúp bạn nhanh chóng xác định nguyên nhân và cách khắc phục chính xác nhất.

---

## 1. Bảng tra cứu sự cố nhanh

| Hiện tượng lỗi | Nguyên nhân cốt lõi | Cách khắc phục triệt để |
| :--- | :--- | :--- |
| **1. Guard không chặn request (gửi token bừa bãi vẫn qua)** | • Chưa gắn `@UseGuards(AuthGuard)` trên Controller/Route.<br/>• Hoặc chưa đăng ký Guard toàn cục trong `app.module.ts` / `main.ts`. | • Kiểm tra decorator `@UseGuards(AuthGuard)` trên `TodosController`.<br/>• Hoặc khai báo `{ provide: APP_GUARD, useClass: AuthGuard }` trong `app.module.ts`. |
| **2. Interceptor không in log thời gian** | • Guard đã chặn request ngay từ trạm trước (trả 401).<br/>• Hoặc chưa bọc `tap()` quanh `next.handle()`. | • Kiểm tra status trả về: Nếu status là 401 thì Interceptor chưa hề chạy (đúng lý thuyết!). Hãy gửi kèm token hợp lệ `Bearer lab-token`. |
| **3. Không đo được thời gian khi Controller ném lỗi** | • Trong `tap()`, bạn chỉ truyền một hàm callback cho nhánh thành công (`next`), bỏ quên nhánh thất bại (`error`). | • Sửa `tap(() => {...})` thành dạng object `tap({ next: () => {...}, error: (err) => {...} })` để đo thời gian cho cả hai trường hợp. |
| **4. Response thành công không được bọc envelope (`data`, `success`)** | • Quên gọi `.pipe(map(...))` trên `next.handle()`.<br/>• Hoặc hàm trong `map()` quên `return`. | • Đảm bảo trong `TransformInterceptor` có đoạn: `return next.handle().pipe(map(data => ({ success: true, statusCode: 200, data, timestamp: new Date().toISOString() })));`. |
| **5. Exception Filter không bắt được lỗi** | • Lỗi đã bị bọc trong khối `try/catch` ở Service mà không được `throw` ra ngoài.<br/>• Hoặc Filter chỉ khai `@Catch(HttpException)` nên không bắt được lỗi `Error` thông thường. | • Đảm bảo Service ném lỗi ra ngoài (`throw new NotFoundException(...)`).<br/>• Trong Filter, sử dụng `@Catch()` (để trống ngoặc) để bắt **mọi** loại ngoại lệ. |
| **6. Lộ stack trace nguy hiểm ra ngoài client khi gặp lỗi 500** | • Trong hàm `catch()` của Filter, bạn đưa trực tiếp `exception.stack` hoặc `exception.message` nội bộ vào JSON trả về. | • Chỉ dùng `console.error(exception)` để ghi log phía server; đối với client, chỉ trả về chuỗi thông báo tổng quát: `"Đã có lỗi xảy ra trên hệ thống, vui lòng thử lại sau"`. |
| **7. Lỗi Circular Dependency (Vòng lặp phụ thuộc)** | • Module A import Module B, đồng thời Module B lại import ngược lại Module A mà không dùng `forwardRef()`. | • Trong phạm vi bài lab này, giữ cấu trúc phẳng: `TodosModule` độc lập, không import chéo lẫn nhau. |

---

## 2. Phân tích chi tiết các tình huống kinh điển

### Tình huống A: "Tại sao tôi gửi request sai token mà Interceptor không in ra dòng log nào?"
* **Lời giải thích:** Đây **không phải lỗi**, mà là minh chứng cho thấy hệ thống hoạt động hoàn toàn chính xác!
* **Cơ chế:** Guard đứng ở trạm số 2, trước Interceptor ở trạm số 3. Khi Guard thấy token sai, nó lập tức ném lỗi 401 và đá request sang Exception Filter. Request chưa từng bước chân vào Interceptor, do đó Interceptor không thể có log.
* **Bài học:** Nếu bạn muốn ghi nhận mọi request kể cả khi bị Guard từ chối, hãy đặt logic đó ở tầng **Middleware** (ví dụ: `RequestIdMiddleware`).

---

### Tình huống B: "Tại sao `tap()` và `map()` trong RxJS của tôi bị báo lỗi TypeScript?"
* **Lời giải thích:** Bạn có thể đã import sai nguồn hoặc quên import các toán tử từ `rxjs/operators` (hoặc `rxjs`).
* **Cách viết đúng chuẩn:**
  ```typescript
  import { Observable } from 'rxjs';
  import { map, tap } from 'rxjs/operators'; // Hoặc import trực tiếp từ 'rxjs'
  ```

---

### Tình huống C: "Trong Exception Filter, làm sao phân biệt được lỗi do tôi cố ý ném ra và lỗi do code bị crash?"
* **Lời giải thích:** Sử dụng toán tử `instanceof HttpException`:
  ```typescript
  if (exception instanceof HttpException) {
    // Đây là lỗi nghiệp vụ có kiểm soát (400, 401, 404,...)
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();
    // Xử lý an toàn...
  } else {
    // Đây là lỗi code crash bất ngờ (500 Internal Server Error)
    // 1. Log chi tiết ra terminal cho dev sửa
    console.error('CRASH UNEXPECTED:', exception);

    // 2. Trả về thông báo an toàn, không lộ stack trace
    response.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Đã có lỗi hệ thống xảy ra',
    });
  }
  ```

> [!TIP]
> Bất cứ khi nào bạn thấy nghi ngờ, hãy mở file [../tests/request-lifecycle.e2e-spec.ts](../tests/request-lifecycle.e2e-spec.ts) và chạy lệnh `npm test` để bộ kiểm thử tự động chỉ điểm mắt xích đang bị lệch chuẩn!
