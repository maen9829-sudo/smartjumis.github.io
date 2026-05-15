import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable validation globally (uses class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,       // Auto-transform types
    }),
  );

  // CORS — allow frontend to connect
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'https://smartjumis-github-io.vercel.app',
      process.env.FRONTEND_URL || ''
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}/api`);
}

bootstrap();
