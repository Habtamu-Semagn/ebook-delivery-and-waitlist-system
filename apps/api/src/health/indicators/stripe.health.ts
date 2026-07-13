import { Injectable } from '@nestjs/common'
import { HealthIndicatorService } from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'

@Injectable()
export class StripeHealthIndicator {
  private stripe: Stripe

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    )
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key)

    try {
      await this.stripe.balance.retrieve()
      return indicator.up()
    } catch (err) {
      return indicator.down((err as Error).message)
    }
  }
}