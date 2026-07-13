import { Injectable } from '@nestjs/common'
import { HealthIndicatorService } from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseHealthIndicator {
  private client: SupabaseClient

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {
    this.client = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    )
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key)

    try {
      const { error } = await this.client.from('webhook_events').select('event_id').limit(1)

      if (error) throw new Error(error.message)

      return indicator.up()
    } catch (err) {
      return indicator.down((err as Error).message)
    }
  }
}