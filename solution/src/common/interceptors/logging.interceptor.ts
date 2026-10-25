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
    const url = req.originalUrl || req.url;
    const startTime = Date.now();

    // 2. Chuyển quyền xử lý cho Controller qua next.handle()
    return next.handle().pipe(
      // 3. LƯỢT VỀ (Post-controller): Tính toán độ trễ khi có kết quả
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode || 200;
          this.logger.log(
            `[${method}] ${url} - Status: ${statusCode} - ${duration}ms`,
          );
        },
        error: (err: any) => {
          const duration = Date.now() - startTime;
          const message = err?.message || 'Unknown error';
          this.logger.error(
            `[${method}] ${url} - FAILED - ${duration}ms - Error: ${message}`,
          );
        },
      }),
    );
  }
}
