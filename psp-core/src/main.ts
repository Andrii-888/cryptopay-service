// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // ✅ CORS: поддержка множества фронтов
  const originsFromList = parseOrigins(process.env.DASHBOARD_ORIGINS);
  const legacyOrigin = process.env.DASHBOARD_ORIGIN;

  const allowedOrigins = [
    ...originsFromList,
    ...(legacyOrigin ? [legacyOrigin] : []),

    // dev defaults
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ].filter(Boolean);

  const allowedOriginsUnique = Array.from(new Set(allowedOrigins));

  app.enableCors({
    origin: (origin, callback) => {
      // server-to-server / curl без Origin
      if (!origin) return callback(null, true);

      if (allowedOriginsUnique.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // ✅ важно для Fly: слушать на 0.0.0.0
  await app.listen(port, '0.0.0.0');

  // eslint-disable-next-line no-console
  console.log(`PSP-core running on http://0.0.0.0:${port}`);
  // eslint-disable-next-line no-console
  console.log(`CORS allowed origins: ${allowedOriginsUnique.join(', ')}`);
}

bootstrap();
