import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { SupabaseHealthIndicator } from './indicators/supabase.health'
import { FirebaseHealthIndicator } from './indicators/firebase.health'
import { StripeHealthIndicator } from './indicators/stripe.health'
import { ResendHealthIndicator } from './indicators/resend.health'

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly supabaseHealth: SupabaseHealthIndicator,
    private readonly firebaseHealth: FirebaseHealthIndicator,
    private readonly stripeHealth: StripeHealthIndicator,
    private readonly resendHealth: ResendHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.supabaseHealth.isHealthy('supabase'),
      () => this.firebaseHealth.isHealthy('firebase'),
      () => this.stripeHealth.isHealthy('stripe'),
      () => this.resendHealth.isHealthy('resend'),
    ])
  }
}