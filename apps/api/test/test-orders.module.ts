import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { EmailService } from '../src/email/email.service';
import { PurchasesController } from '../src/purchases/purchases.controller';
import { PurchasesService } from '../src/purchases/purchases.service';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [
    OrdersController,
    PurchasesController,
  ],
  providers: [
    OrdersService,
    PurchasesService,

    {
      provide: EmailService,
      useValue: {
        sendPurchaseConfirmation: jest.fn(),
      },
    },
  ],
})
export class TestOrdersModule {}