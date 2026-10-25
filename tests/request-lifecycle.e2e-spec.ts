import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../solution/src/app.module';

describe('Hands-on Lab: Request Lifecycle Verification (T01 - T06)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // T01: Token hợp lệ, nghiệp vụ thành công
  it('T01 [Guard + Interceptor]: Cho phép request hợp lệ và chuẩn hóa response envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/todos')
      .set('Authorization', 'Bearer lab-token')
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('timestamp');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // T02: Thiếu token xác thực
  it('T02 [Guard + ExceptionFilter]: Chặn đứng request thiếu token và trả về lỗi 401 chuẩn', async () => {
    const res = await request(app.getHttpServer())
      .get('/todos')
      .expect(401);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 401,
        message: 'Bạn chưa cung cấp token xác thực!',
        path: '/todos',
      }),
    );
    expect(res.body).toHaveProperty('timestamp');
  });

  // T03: Token sai giá trị
  it('T03 [Guard + ExceptionFilter]: Chặn đứng token sai và trả về 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/todos')
      .set('Authorization', 'Bearer invalid-token-123')
      .expect(401);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 401,
        message: 'Token xác thực không hợp lệ!',
        path: '/todos',
      }),
    );
  });

  // T04: Service phát sinh lỗi nghiệp vụ 404
  it('T04 [ExceptionFilter]: Bắt NotFoundException và format JSON lỗi đồng nhất', async () => {
    const res = await request(app.getHttpServer())
      .get('/todos/999')
      .set('Authorization', 'Bearer lab-token')
      .expect(404);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 404,
        message: 'Không tìm thấy công việc với ID = 999',
        path: '/todos/999',
      }),
    );
    expect(res.body).toHaveProperty('timestamp');
  });

  // T05: Endpoint chậm nhưng thành công
  it('T05 [LoggingInterceptor]: Xử lý thành công endpoint chậm có delay 300ms', async () => {
    const startTime = Date.now();
    const res = await request(app.getHttpServer())
      .get('/todos/slow-endpoint')
      .set('Authorization', 'Bearer lab-token')
      .expect(200);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(280); // Cho phép biên độ nhỏ

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        message: 'Tác vụ đã hoàn thành sau độ trễ 300ms',
        delay: 300,
      }),
    );
  });

  // T06: Lỗi code crash ngoài ý muốn (Error thuần)
  it('T06 [ExceptionFilter Security]: Bắt Error thuần 500 và tuyệt đối không lộ stack trace', async () => {
    const res = await request(app.getHttpServer())
      .get('/todos/trigger-error')
      .set('Authorization', 'Bearer lab-token')
      .expect(500);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'Đã có lỗi hệ thống xảy ra, vui lòng thử lại sau!',
        path: '/todos/trigger-error',
      }),
    );
    // Khẳng định chắc chắn không để lộ stack trace nội bộ ra client
    expect(res.body).not.toHaveProperty('stack');
    expect(JSON.stringify(res.body)).not.toContain('at TodosService');
  });
});
