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

/**
 * BƯỚC 2A: Xây dựng LoggingInterceptor đo lường thời gian xử lý bằng RxJS tap()
 *
 * Nhiệm vụ của bạn:
 * 1. Lấy thông tin HTTP request và response từ ExecutionContext.
 * 2. Ghi nhận thời điểm bắt đầu (startTime = Date.now()).
 * 3. Gọi next.handle().pipe() và sử dụng toán tử tap() để lắng nghe kết quả:
 *    - Trong tap next(): tính duration = Date.now() - startTime và ghi log
 *    - Trong tap error(): tính duration và ghi log lỗi
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // TODO 1: Lấy Request, Response, Method, URL và bấm giờ bắt đầu
    // const ctx = context.switchToHttp();
    // const req = ctx.getRequest<Request>();
    // const res = ctx.getResponse<Response>();
    // const startTime = Date.now();

    // TODO 2: Bọc next.handle() bằng toán tử tap() của RxJS
    // return next.handle().pipe(
    //   tap({
    //     next: () => { ... },
    //     error: (err) => { ... },
    //   }),
    // );

    // Tạm thời cho request đi tiếp không đo giờ:
    return next.handle();
  }
}
