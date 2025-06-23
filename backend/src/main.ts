import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  const allowedOrigins = [
  ];
  
  // Add REACT_APP_FRONTEND_URL from environment if provided
  if (process.env.REACT_APP_FRONTEND_URL) {
    allowedOrigins.push(process.env.REACT_APP_FRONTEND_URL);
  }
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Add global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap(); 