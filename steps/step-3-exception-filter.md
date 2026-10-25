# Bước 3 — Xây dựng Global Exception Filter chuẩn hóa lỗi

> **Thời lượng ước tính:** 10–12 phút  
> **Tập tin cần hoàn thiện:** `src/common/filters/http-exception.filter.ts`  
> **Kiến thức cốt lõi:** Interface `ExceptionFilter`, `@Catch()`, `ArgumentsHost`, bảo mật che giấu stack trace.

---

## 1. Đặt vấn đề

Khi một API phát sinh lỗi, client cần biết chính xác:
* Mã lỗi HTTP là bao nhiêu? (400, 401, 404, 500...)
* Nội dung thông báo lỗi là gì?
* Lỗi xảy ra ở đường dẫn (`path`) nào và tại thời điểm nào (`timestamp`)?

Nếu không có Exception Filter, mỗi nơi trong dự án sẽ trả về một kiểu lỗi:
* Guard trả về `{ statusCode: 401, message: "...", error: "Unauthorized" }`
* DTO Validation Pipe trả về `{ statusCode: 400, message: [ "..." ] }`
* Service ném `throw new Error("Không thể kết nối CSDL")` thì server in nguyên một mảng **Stack Trace** khổng lồ (kèm tên file, đường dẫn ổ cứng, số dòng code) trả thẳng về cho trình duyệt!

Việc để lộ Stack Trace ra ngoài là một **lỗ hổng bảo mật nghiêm trọng**, giúp hacker biết được cấu trúc mã nguồn bên trong để lên kế hoạch tấn công.

**Exception Filter** ra đời như một "đội cứu hộ chuyên nghiệp": gom mọi lỗi phát sinh về một mối, chuẩn hóa định dạng JSON phản hồi và giữ bí mật tuyệt đối thông tin nội bộ của server.

---

## 2. Yêu cầu kỹ thuật của Filter

Chúng ta sẽ tạo một `HttpExceptionFilter` toàn cục:
1. Gắn decorator `@Catch()` để bắt **mọi loại ngoại lệ** (cả `HttpException` có kiểm soát lẫn `Error` thuần do code bị crash).
2. Dùng `host.switchToHttp()` để lấy đối tượng `Request` và `Response` của Express.
3. Phân biệt rõ hai trường hợp:
   * **Nếu là `HttpException`:** Lấy đúng mã `status` (`400`, `401`, `404`...) và `message` nghiệp vụ.
   * **Nếu là lỗi không lường trước (`Error` thuần):** In stack trace ra màn hình terminal của server để lập trình viên sửa lỗi, nhưng chỉ trả về client mã **500** kèm lời nhắn an toàn: `"Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau!"`.

Cấu trúc JSON lỗi chuẩn mực:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Không tìm thấy công việc với ID = 999",
  "path": "/todos/999",
  "timestamp": "2026-10-24T12:00:00.000Z"
}
```

---

## 3. Thực hành: Hoàn thiện code

Mở file `src/common/filters/http-exception.filter.ts` và hoàn thiện code:

```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Để trống ngoặc để bắt TẤT CẢ mọi ngoại lệ
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau!';

    // 1. Phân nhánh nếu là HttpException có chủ đích (400, 401, 404...)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        message = (res as any).message;
      }
    } else {
      // 2. Phân nhánh nếu là Lỗi code crash bất ngờ (Error thuần)
      this.logger.error('CRASH UNEXPECTED EXCEPTION:', exception);
    }

    // 3. Trả về JSON lỗi chuẩn mực và an toàn tuyệt đối
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 4. Kích hoạt Exception Filter toàn cục

Đăng ký Filter trong file `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  // ...
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // ... các Interceptor khác
  ],
})
export class AppModule {}
```

---

## 5. Kiểm chứng kết quả thực tế

### Kịch bản 1: Lỗi nghiệp vụ 404 (Không tìm thấy Todo)
```bash
curl -i -H "Authorization: Bearer lab-token" http://localhost:3000/todos/999
```
* **Kết quả:** Mã HTTP `404 Not Found`
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Không tìm thấy công việc với ID = 999",
  "path": "/todos/999",
  "timestamp": "2026-10-24T12:00:00.000Z"
}
```

### Kịch bản 2: Lỗi xác thực 401 từ Guard
```bash
curl -i http://localhost:3000/todos
```
* **Kết quả:** Mã HTTP `401 Unauthorized` có định dạng đồng nhất tuyệt đối với mã lỗi 404 ở trên:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Bạn chưa cung cấp token xác thực!",
  "path": "/todos",
  "timestamp": "2026-10-24T12:00:00.000Z"
}
```

### Kịch bản 3: Lỗi code crash bất ngờ (Giả lập lỗi Server 500)
Chúng tôi đã tạo sẵn route `/todos/trigger-error` để cố tình `throw new Error("Lỗi kết nối cơ sở dữ liệu nội bộ!")`:
```bash
curl -i -H "Authorization: Bearer lab-token" http://localhost:3000/todos/trigger-error
```
* **Kết quả Client nhận được:** Mã HTTP `500 Internal Server Error`
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau!",
  "path": "/todos/trigger-error",
  "timestamp": "2026-10-24T12:00:00.000Z"
}
```
* **Quan sát Server Terminal:** Toàn bộ Stack Trace được ghi an toàn trên log console để lập trình viên debug, **hoàn toàn không bị lộ** ra cho người dùng!

---

## 6. Câu hỏi suy ngẫm

> **Câu hỏi:** Vì sao chúng ta khẳng định Exception Filter không phải là một bước mà mọi request đều đi qua?  
> **Trả lời:** Với một request thành công suôn sẻ (HTTP 200), luồng xử lý đi thẳng từ Controller $\rightarrow$ Interceptor (lượt về) $\rightarrow$ Client. Exception Filter chỉ được gọi khi có ngoại lệ chưa được bắt phát sinh. Nó hoạt động như một bẫy cứu hộ khẩn cấp rẽ nhánh, chứ không phải một trạm trung chuyển tuần tự.

Chúc mừng bạn đã hoàn thành trọn vẹn 3 bước thực hành! Hãy mở file [../tests/request-lifecycle.e2e-spec.ts](../tests/request-lifecycle.e2e-spec.ts) và chạy bài kiểm thử tự động để khẳng định kết quả.
