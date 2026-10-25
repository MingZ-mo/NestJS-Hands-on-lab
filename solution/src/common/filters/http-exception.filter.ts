import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Bắt mọi ngoại lệ (cả HttpException lẫn Error thuần)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object =
      'Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau!';

    // 1. Phân nhánh nếu là HttpException có chủ đích (400, 401, 404...)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        message = (res as any).message;
      } else {
        message = res;
      }
    } else {
      // 2. Phân nhánh nếu là Lỗi code crash bất ngờ (Error thuần)
      // Ghi log stack trace ra console server cho dev debug, tuyệt đối không trả stack trace về client
      this.logger.error('CRASH UNEXPECTED EXCEPTION:', exception);
    }

    // 3. Trả về response JSON lỗi chuẩn mực và bảo mật
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
