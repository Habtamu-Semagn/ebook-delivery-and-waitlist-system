import { Module } from '@nestjs/common';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { EmailModule } from 'src/email/email.module';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [EmailModule, FirebaseModule],
  controllers: [WaitlistController],
  providers: [WaitlistService]
})
export class WaitlistModule {}
