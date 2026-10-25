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

/**
 * BƯỚC 2B: Xây dựng TransformInterceptor chuẩn hóa Response Envelope bằng RxJS map()
 *
 * Nhiệm vụ của bạn:
 * 1. Lấy response từ ExecutionContext để đọc status code.
 * 2. Gọi next.handle().pipe(map(data => (...))) để bọc dữ liệu trả về theo chuẩn:
 *    {
 *      success: true,
 *      statusCode: response.statusCode || 200,
 *      data: data,
 *      timestamp: new Date().toISOString()
 *    }
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    // TODO 1: Lấy response từ context
    // const response = context.switchToHttp().getResponse<Response>();

    // TODO 2: Dùng map() biến đổi dữ liệu trả về từ Controller
    // return next.handle().pipe(
    //   map((data: T) => ({
    //     success: true,
    //     statusCode: response.statusCode || 200,
    //     data,
    //     timestamp: new Date().toISOString(),
    //   })),
    // );

    // Tạm thời trả nguyên bản dữ liệu:
    return next.handle();
  }
}
