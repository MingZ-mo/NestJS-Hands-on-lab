# Bước 2 — Xây dựng Interceptors đo thời gian và chuẩn hóa Response

> **Thời lượng ước tính:** 12–15 phút  
> **Tập tin cần hoàn thiện:**  
> 1. `src/common/interceptors/logging.interceptor.ts`  
> 2. `src/common/interceptors/transform.interceptor.ts`  
> **Kiến thức cốt lõi:** Interface `NestInterceptor`, `CallHandler`, RxJS `tap()` & `map()`.

---

## 1. Đặt vấn đề

Ở bước 1, Guard đã bảo vệ cửa ngõ của ứng dụng. Nhưng khi request đã bước chân vào Controller, ta lại đối mặt với hai bài toán mới:

1. **Hiệu năng hệ thống:** Làm sao biết được một request tốn bao nhiêu mili-giây để xử lý? Nếu nhét code đo giờ (`Date.now()`) vào từng controller thì vừa bẩn code vừa lặp lại khắp nơi. Nếu đặt ở middleware thì middleware lại không biết khi nào controller chạy xong.
2. **Tính đồng nhất của API:** Frontend luôn muốn nhận về một cấu trúc dữ liệu cố định (gọi là *response envelope*):
   ```json
   {
     "success": true,
     "statusCode": 200,
     "data": [ ... ],
     "timestamp": "2026-10-24T12:00:00.000Z"
   }
   ```
   Nếu bắt từng hàm của Service hoặc Controller tự tay bọc object này thì vừa phiền phức, vừa dễ quên.

Giải pháp hoàn hảo của NestJS chính là **Interceptor** — lớp duy nhất bọc ở cả hai đầu của Controller (vừa đón ở lượt đi, vừa tiễn ở lượt về).

---

## 2. Hoàn thiện `LoggingInterceptor` (Đo thời gian với `tap`)

Toán tử `tap()` trong RxJS cho phép ta "lắng nghe" và thực thi các thao tác phụ (như in log, đo thời gian) mà **không làm thay đổi bất kỳ byte dữ liệu nào** của Controller.

Mở file `src/common/interceptors/logging.interceptor.ts` và hoàn thiện code:

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. LƯỢT ĐI (Pre-controller): Bấm giờ ngay trước khi Controller xử lý
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const method = req.method;
    const url = req.url;
    const startTime = Date.now();

    // 2. Chuyển quyền xử lý cho Controller qua next.handle()
    return next.handle().pipe(
      // 3. LƯỢT VỀ (Post-controller): Tính toán độ trễ khi có kết quả
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode || 200;
          this.logger.log(`[${method}] ${url} - Status: ${statusCode} - ${duration}ms`);
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.error(`[${method}] ${url} - FAILED - ${duration}ms - Error: ${err.message}`);
        },
      }),
    );
  }
}
```

---

## 3. Hoàn thiện `TransformInterceptor` (Chuẩn hóa Response với `map`)

Khác với `tap()`, toán tử `map()` nhận vào giá trị `data` trả về từ Controller và **biến đổi** nó thành một cấu trúc mới trước khi bay ra ngoài cho client.

Mở file `src/common/interceptors/transform.interceptor.ts` và hoàn thiện code:

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        statusCode: response.statusCode || 200,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

---

## 4. Kích hoạt Interceptor toàn cục

Cách tốt nhất là đăng ký hai Interceptor này ở cấp độ toàn cục trong `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TodosModule } from './todos/todos.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [TodosModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
```

---

## 5. Kiểm chứng kết quả thực tế

### Kiểm chứng 1: Chuẩn hóa Response Envelope
Gửi request lấy danh sách todos kèm token:
```bash
curl -H "Authorization: Bearer lab-token" http://localhost:3000/todos
```
* **Kết quả nhận được trên Client:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    { "id": 1, "title": "Học NestJS Request Lifecycle", "status": "IN_PROGRESS" },
    { "id": 2, "title": "Làm bài tập Hands-on Lab", "status": "OPEN" }
  ],
  "timestamp": "2026-10-24T12:00:00.000Z"
}
```
* **Dòng log xuất hiện trên Server Console:**
```text
[LoggingInterceptor] [GET] /todos - Status: 200 - 3ms
```

### Kiểm chứng 2: Thử nghiệm endpoint chậm (giả lập delay)
Chúng tôi đã chuẩn bị sẵn endpoint `/todos/slow-endpoint` (có `setTimeout` trễ 300ms):
```bash
curl -H "Authorization: Bearer lab-token" http://localhost:3000/todos/slow-endpoint
```
* **Quan sát Server Console:**
```text
[LoggingInterceptor] [GET] /todos/slow-endpoint - Status: 200 - 304ms
```
Thời gian thực tế đã được `LoggingInterceptor` bắt trọn vẹn và chính xác!

---

## 6. Câu hỏi suy ngẫm

> **Câu hỏi:** Giả sử bạn gửi request nhưng quên header `Authorization`, request bị `AuthGuard` từ chối (401). Tại sao `LoggingInterceptor` không hề in ra dòng log nào?  
> **Trả lời:** Vì trong Request Lifecycle, **Guard chạy trước Interceptor**. Khi Guard ném `UnauthorizedException`, request bị ngắt và chuyển hướng thẳng sang `Exception Filter`. Nó chưa từng đi qua `next.handle()` của Interceptor, nên Interceptor không được kích hoạt!

Tuyệt vời! Bây giờ hãy chuyển sang [step-3-exception-filter.md](step-3-exception-filter.md) để dựng nốt chiếc lá chắn cuối cùng: **Exception Filter**.
