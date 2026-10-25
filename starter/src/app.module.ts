import { Module } from '@nestjs/common';
import { TodosModule } from './todos/todos.module';

// GỢI Ý BƯỚC 2 & 3:
// Sau khi hoàn thành LoggingInterceptor, TransformInterceptor và HttpExceptionFilter,
// Bạn sẽ import APP_INTERCEPTOR, APP_FILTER từ '@nestjs/core' và đăng ký vào mảng providers dưới đây!

@Module({
  imports: [TodosModule],
  controllers: [],
  providers: [
    /*
    // --- BƯỚC 2: Đăng ký Interceptor toàn cục ---
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // --- BƯỚC 3: Đăng ký Exception Filter toàn cục ---
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    */
  ],
})
export class AppModule {}
