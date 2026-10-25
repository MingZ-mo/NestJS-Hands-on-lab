import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * BƯỚC 1: Xây dựng Custom Guard kiểm soát truy cập
 *
 * Nhiệm vụ của bạn:
 * 1. Chuyển context sang HTTP và lấy ra đối tượng Request.
 * 2. Lấy header 'authorization' từ request.
 * 3. Nếu thiếu header -> ném UnauthorizedException('Bạn chưa cung cấp token xác thực!')
 * 4. Nếu token khác 'Bearer lab-token' -> ném UnauthorizedException('Token xác thực không hợp lệ!')
 * 5. Nếu token hợp lệ -> gắn request['user'] và trả về true.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO 1: Lấy Request từ ExecutionContext
    // const request = context.switchToHttp().getRequest<Request>();

    // TODO 2: Đọc header 'authorization'
    // const authHeader = ...

    // TODO 3: Kiểm tra thiếu token
    // if (!authHeader) { ... }

    // TODO 4: Kiểm tra token sai
    // if (authHeader !== 'Bearer lab-token') { ... }

    // TODO 5: Gán thông tin user giả lập vào request và trả về true
    // request['user'] = { id: 1, username: 'lab-user', role: 'LEARNER' };
    // return true;

    // Tạm thời cho qua để test ban đầu:
    return true;
  }
}
