import { Injectable } from '@nestjs/common'
import { HealthIndicatorService } from '@nestjs/terminus'
import { getAuth } from 'firebase-admin/auth'

@Injectable()
export class FirebaseHealthIndicator {
  constructor(private readonly healthIndicatorService: HealthIndicatorService) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key)

    try {
      await getAuth().listUsers(1)
      return indicator.up()
    } catch (err) {
      return indicator.down((err as Error).message)
    }
  }
}