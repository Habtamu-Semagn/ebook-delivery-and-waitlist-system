import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { EmailModule } from './email/email.module';
import { BooksModule } from './books/books.module';
import { OrdersModule } from './orders/orders.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { PurchasesModule } from './purchases/purchases.module';
import { PaymentsModule } from './payments/payments.module';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ 
    SentryModule.forRoot(),
    ConfigModule.forRoot({
    isGlobal: true,
  }),
    FirebaseModule,
    UsersModule,
    WebhooksModule,
    EmailModule,
    BooksModule,
    OrdersModule,
    WaitlistModule,
    PurchasesModule,
    PaymentsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },],
})
export class AppModule {}
