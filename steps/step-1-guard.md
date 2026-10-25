# Bước 1 — Xây dựng Custom Guard kiểm soát truy cập

> **Thời lượng ước tính:** 10–12 phút  
> **Tập tin cần hoàn thiện:** `src/common/guards/auth.guard.ts`  
> **Kiến thức cốt lõi:** Interface `CanActivate`, `ExecutionContext`, `UnauthorizedException`.

---

## 1. Đặt vấn đề

Hãy tưởng tượng bạn vừa xuất bản một API Todos cho công ty. Bất kỳ ai trên internet, dù có tài khoản hay không, chỉ cần gõ đúng URL là có thể xem và chỉnh sửa danh sách công việc. Điều này cực kỳ nguy hiểm.

Trong Express thuần, bạn thường viết một middleware kiểm tra header `Authorization`. Nhưng trong NestJS, việc xác định **"Người này là ai và họ có được phép vào đây không?"** được giao cho một lớp chuyên trách: **Guard**.

Guard chạy **ngay sau Middleware** và đứng sừng sững **trước cả Interceptor và Pipe**. Nếu Guard lắc đầu từ chối, request sẽ bị chặn đứng ngay trước cửa, bảo vệ tài nguyên hệ thống phía sau không bị lãng phí.

---

## 2. Yêu cầu kỹ thuật của Guard

Trong bước này, chúng ta sẽ tạo một `AuthGuard` kiểm tra token giả lập:
1. Đọc header `Authorization` từ request gửi lên.
2. Kiểm tra chuỗi token:
   * Nếu không có header `Authorization`: Ném lỗi `UnauthorizedException('Bạn chưa cung cấp token xác thực!')`.
   * Nếu có header nhưng giá trị khác chuỗi `'Bearer lab-token'`: Ném lỗi `UnauthorizedException('Token xác thực không hợp lệ!')`.
   * Nếu token chính xác là `'Bearer lab-token'`: Gắn thông tin người dùng giả lập vào request:
     ```typescript
     request['user'] = { id: 1, username: 'lab-user', role: 'LEARNER' };
     ```
     và trả về `true` để cho phép request đi tiếp.

> [!NOTE]
> **Vì sao ném `UnauthorizedException` thay vì chỉ `return false`?**  
> Mặc định trong NestJS, nếu hàm `canActivate()` trả về `false`, framework sẽ tự động trả về mã lỗi **403 Forbidden** (Đã biết bạn là ai nhưng bạn không có quyền). Tuy nhiên, khi client không gửi token hoặc token sai, mã HTTP chuẩn mực của giao thức REST API phải là **401 Unauthorized** (Bạn chưa đăng nhập / chưa chứng minh được danh tính). Việc chủ động ném `UnauthorizedException` giúp ta kiểm soát chính xác mã HTTP 401 trả về cho client.

---

## 3. Thực hành: Hoàn thiện code

Mở file `src/common/guards/auth.guard.ts` trong thư mục `starter/`. Bạn sẽ thấy khung sườn được chuẩn bị sẵn. Hãy điền code logic vào phần `// TODO`:

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. Chuyển đổi ngữ cảnh sang HTTP và lấy ra object Request
    const request = context.switchToHttp().getRequest<Request>();

    // 2. Lấy giá trị header Authorization
    const authHeader = request.headers['authorization'];

    // 3. Kiểm tra trường hợp thiếu header
    if (!authHeader) {
      throw new UnauthorizedException('Bạn chưa cung cấp token xác thực!');
    }

    // 4. Kiểm tra giá trị token giả lập chuẩn
    if (authHeader !== 'Bearer lab-token') {
      throw new UnauthorizedException('Token xác thực không hợp lệ!');
    }

    // 5. Gắn thông tin người dùng giả lập vào request để các tầng sau sử dụng
    request['user'] = {
      id: 1,
      username: 'lab-user',
      role: 'LEARNER',
    };

    // 6. Cho phép request đi tiếp
    return true;
  }
}
```

---

## 4. Kích hoạt Guard trên Controller

Để Guard bắt đầu làm việc, mở file `src/todos/todos.controller.ts` và gắn decorator `@UseGuards(AuthGuard)` lên đầu class:

```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { AuthGuard } from '../common/guards/auth.guard';

@UseGuards(AuthGuard) // <--- GẮN GUARD Ở ĐÂY
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}
  // ...
}
```

---

## 5. Kiểm chứng kết quả thực tế

Hãy mở một Terminal mới và kiểm tra cả 3 tình huống:

### Tình huống 1: Không truyền token (Thiếu Header)
```bash
curl -i http://localhost:3000/todos
```
* **Kết quả mong đợi:** Mã HTTP `401 Unauthorized`
```json
{
  "message": "Bạn chưa cung cấp token xác thực!",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Tình huống 2: Truyền sai token
```bash
curl -i http://localhost:3000/todos \
  -H "Authorization: Bearer token-tam-bay"
```
* **Kết quả mong đợi:** Mã HTTP `401 Unauthorized`
```json
{
  "message": "Token xác thực không hợp lệ!",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Tình huống 3: Truyền đúng token chuẩn `Bearer lab-token`
```bash
curl -i http://localhost:3000/todos \
  -H "Authorization: Bearer lab-token"
```
* **Kết quả mong đợi:** Mã HTTP `200 OK` kèm danh sách todos ban đầu.

---

## 6. Câu hỏi suy ngẫm

> **Câu hỏi:** Vì sao NestJS lại thiết kế Guard chạy trước Pipe và Controller?  
> **Trả lời:** Nếu dữ liệu client gửi lên rất nặng (ví dụ file tải lên vài chục Megabytes) hoặc có hàng chục trường cần validate phức tạp, việc chạy Guard trước sẽ giúp chặn đứng kẻ không có quyền ngay từ cửa mà không lãng phí CPU để parse và validate dữ liệu ở Pipe. Tiết kiệm tối đa tài nguyên cho server!

Bạn đã hoàn thành xuất sắc Bước 1! Hãy tiếp tục tới [step-2-interceptor.md](step-2-interceptor.md).
