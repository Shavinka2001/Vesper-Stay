import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { CryptoModule } from '@common/crypto/crypto.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import configuration from '@config/configuration';
import { validateEnv } from '@config/env.validation';
import { AuthModule } from '@modules/auth/auth.module';
import { BookingsModule } from '@modules/bookings/bookings.module';
import { ChannelManagerModule } from '@modules/channel-manager/channel-manager.module';
import { PosModule } from '@modules/pos/pos.module';
import { PropertiesModule } from '@modules/properties/properties.module';
import { RoomsModule } from '@modules/rooms/rooms.module';
import { StaffModule } from '@modules/staff/staff.module';
import { PrismaModule } from '@prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    CryptoModule,
    PrismaModule,
    AuthModule,
    PropertiesModule,
    RoomsModule,
    BookingsModule,
    PosModule,
    ChannelManagerModule,
    StaffModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
