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
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        
        if (redisUrl) {
          // Use REDIS_URL for Upstash or other Redis providers
          return {
            connection: {
              url: redisUrl,
            },
          };
        }
        
        // Fallback to REDIS_HOST and REDIS_PORT for local development
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        };
      },
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
