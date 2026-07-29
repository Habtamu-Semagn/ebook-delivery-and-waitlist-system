import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { HealthController } from './health.controller'
import { SupabaseHealthIndicator } from './indicators/supabase.health'
import { FirebaseHealthIndicator } from './indicators/firebase.health'
import { StripeHealthIndicator } from './indicators/stripe.health'
import { ResendHealthIndicator } from './indicators/resend.health'

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    SupabaseHealthIndicator,
    FirebaseHealthIndicator,
    StripeHealthIndicator,
    ResendHealthIndicator,
  ],
})
export class HealthModule {}