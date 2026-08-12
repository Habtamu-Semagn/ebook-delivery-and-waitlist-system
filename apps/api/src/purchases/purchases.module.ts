import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [FirebaseModule, EmailModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
