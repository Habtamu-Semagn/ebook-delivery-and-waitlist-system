import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { PurchasesModule } from 'src/purchases/purchases.module';
import { WaitlistModule } from 'src/waitlist/waitlist.module';
import { UsersModule } from 'src/users/users.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [FirebaseModule, PurchasesModule, WaitlistModule, UsersModule, EmailModule],
  controllers: [AdminController]
})
export class AdminModule {}
