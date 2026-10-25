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

    // 6. Cho phép request đi tiếp vào Controller/Interceptor
    return true;
  }
}
