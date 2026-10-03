import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = Number(process.env.PORT) || 5000;
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-property-id',
      'Accept',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VesperStay API')
    .setDescription(
      'Luxury hotel property management system and real-time OTA channel manager (Booking.com, Airbnb).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-property-id',
        in: 'header',
        description: 'Active property (tenant) scope',
      },
      'property-id',
    )
    .addTag('Health')
    .addTag('Auth')
    .addTag('Properties')
    .addTag('Rooms')
    .addTag('Bookings')
    .addTag('POS')
    .addTag('Channel Manager')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);

  logger.log(`VesperStay API listening on http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

void bootstrap();
