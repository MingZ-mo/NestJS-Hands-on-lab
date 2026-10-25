import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('HandsOnLabBootstrap');
  const app = await NestFactory.create(AppModule);

  // Kích hoạt ValidationPipe toàn cục để kiểm tra dữ liệu theo DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);
  logger.log(`Server Hands-on Lab đang chạy tại http://localhost:${PORT}`);
  logger.log(`Thử nghiệm nhanh: GET http://localhost:${PORT}/todos`);
}

void bootstrap();
