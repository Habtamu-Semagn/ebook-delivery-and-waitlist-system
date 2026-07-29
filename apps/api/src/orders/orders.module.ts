import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [FirebaseModule, EmailModule],
  providers: [OrdersService],
  controllers: [OrdersController]
})
export class OrdersModule {}
