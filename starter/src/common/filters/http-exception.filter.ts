import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * BƯỚC 3: Xây dựng Global Exception Filter chuẩn hóa lỗi và bảo mật thông tin
 *
 * Nhiệm vụ của bạn:
 * 1. Đặt decorator @Catch() để bắt toàn bộ ngoại lệ.
 * 2. Lấy Request và Response từ ArgumentsHost (host.switchToHttp()).
 * 3. Nếu là HttpException: lấy status code và message nghiệp vụ.
 * 4. Nếu là Error thuần (crash ngoài ý muốn):
 *    - Ghi log stack trace ra terminal để lập trình viên sửa lỗi.
 *    - Trả về mã 500 cùng message an toàn: "Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau!".
 * 5. Chuẩn hóa format phản hồi:
 *    {
 *      success: false,
 *      statusCode: status,
 *      message: message,
 *      path: request.url,
 *      timestamp: new Date().toISOString()
 *    }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // TODO 1: Khởi tạo giá trị mặc định cho status 500 và thông báo an toàn
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object =
      'Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau!';

    // TODO 2: Kiểm tra nếu exception instanceof HttpException
    // if (exception instanceof HttpException) {
    //   status = exception.getStatus();
    //   const res = exception.getResponse();
    //   message = typeof res === 'string' ? res : (res as any).message || res;
    // } else {
    //   this.logger.error('CRASH UNEXPECTED EXCEPTION:', exception);
    // }

    // TODO 3: Trả về response JSON chuẩn
    // response.status(status).json({
    //   success: false,
    //   statusCode: status,
    //   message,
    //   path: request.url,
    //   timestamp: new Date().toISOString(),
    // });

    // Tạm thời trả lỗi mặc định nếu chưa hoàn thiện:
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }
    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
