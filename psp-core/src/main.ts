import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔐 Глобальная валидация DTO (нужно для class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет лишние поля
      transform: true, // конвертирует строки → числа и т.д.
      forbidNonWhitelisted: false, // не кидает ошибку на лишние поля
    }),
  );

  // 🔐 Разрешаем запросы только с dashboard-frontend
  const dashboardOrigin =
    process.env.DASHBOARD_ORIGIN ?? 'http://localhost:3001';

  app.enableCors({
    origin: dashboardOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`PSP-core running on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`CORS enabled for: ${dashboardOrigin}`);
}

bootstrap();
