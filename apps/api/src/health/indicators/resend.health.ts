import { Injectable } from '@nestjs/common'
import { HealthIndicatorService } from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

@Injectable()
export class ResendHealthIndicator {
  private resend: Resend

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    )
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key)

    try {
      const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY')

      if (!apiKey || !apiKey.startsWith('re_')) {
        throw new Error('Invalid or missing RESEND_API_KEY format')
      }

      const { error } = await this.resend.apiKeys.list()

      if (error && !error.message.includes('restricted')) {
        throw new Error(error.message)
      }

      return indicator.up()
    } catch (err) {
      const message = (err as Error).message

      if (message.includes('restricted') || message.includes('send emails')) {
        return indicator.up()
      }

      return indicator.down(message)
    }
  }
}