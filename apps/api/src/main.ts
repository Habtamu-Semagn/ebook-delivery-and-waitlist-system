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
    origin: "http://localhost:3000",
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
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3002);
  console.log('Swagger docs available at http://localhost:3002/api/docs');
}
bootstrap();