import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReconciliationService } from './reconciliation.service';
import { EmailModule } from '../email/email.module';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    EmailModule,
  ],
  providers: [ReconciliationService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}