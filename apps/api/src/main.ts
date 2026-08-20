import "./instrument"
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import ws from 'ws'

if (!globalThis.WebSocket) {
  // @ts-expect-error ws compatible type
  globalThis.WebSocket = ws
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {rawBody: true});
  app.useGlobalFilters(new GlobalExceptionFilter())

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('E-book System API')
    .setDescription('E-book Delivery & Waitlist System API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'Firebase',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Add servers based on environment
  if (process.env.NODE_ENV === 'production' && process.env.API_URL) {
    document.servers = [
      { url: process.env.API_URL, description: 'Production' },
      { url: 'http://localhost:3002', description: 'Local Development' }
    ];
  }
  
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  // Determine the base URL for Swagger docs
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.API_URL || `https://your-api-name.onrender.com`
    : `http://localhost:${port}`;
  
  console.log(`Swagger docs available at ${baseUrl}/api/docs`);
}
bootstrap();