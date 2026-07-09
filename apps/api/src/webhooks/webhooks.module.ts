import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebhooksProcessor } from './webhooks.processor'
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'webhook-events',
      defaultJobOptions: {
        attempts: 6,
        backoff: {
          type: 'custom',
        }
      }
    }),
    EmailModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksProcessor]
})
export class WebhooksModule {}
