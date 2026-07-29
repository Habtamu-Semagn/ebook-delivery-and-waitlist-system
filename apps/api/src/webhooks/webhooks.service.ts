import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe'
import { Queue } from 'bullmq';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable()
export class WebhooksService {
    private stripe: Stripe;
    private supabase: SupabaseClient;
    private webhookSecret: string;
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
      private configService: ConfigService,
      @InjectQueue('webhook-events') private webhookQueue: Queue,
    ) {
        this.stripe = new Stripe(
            this.configService.getOrThrow<string>('STRIPE_SECRET_KEY')
        )
        this.webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
        this.supabase = createClient(
            this.configService.getOrThrow<string>('SUPABASE_URL'),
            this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
            {
                realtime: {
                    transport: require('ws'),
                }
            }
        )
    }

    verifySignature(rawBody: Buffer, signature: string): Stripe.Event {
        return this.stripe.webhooks.constructEvent(
            rawBody, 
            signature,
            this.webhookSecret
        )
      // uses stripe.webhooks.constructEvent()
      // returns the verified, parsed event
      // throws if invalid
    }
  
    async isEventAlreadyProcessed(eventId: string): Promise<boolean> {
        const { data } = await this.supabase
        .from('webhook_events')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();

        return !!data;
      // query webhook_events table by event_id
      // return true if found
    }

    async saveEvent(eventId: string, payload: object): Promise<void> {
        const { error } = await this.supabase.from('webhook_events').insert({
          event_id: eventId,
          payload,
          status: 'pending',
          attempts: 0,
        });

        if (error) {
          throw new Error(`Failed to save webhook event: ${error.message}`);
        }
      // insert into webhook_events with status: 'pending'
    }

    async processEvent(event: Stripe.Event, correlationId: string): Promise<void> {
        const alreadyProcessed = await this.isEventAlreadyProcessed(event.id);
        if (alreadyProcessed) {
          this.logger.log(`[${correlationId}] Event already processed: ${event.id}`);
          return;
        }
        
        await this.saveEvent(event.id, event);
        
        this.logger.log(`[${correlationId}] Adding job to queue for event: ${event.id} (${event.type})`);

        // Fire and forget - don't await queue operations to prevent webhook timeout
        // Stripe expects fast response (< 5s), queue job is added in background
        this.webhookQueue.add('process-webhook', {
          eventId: event.id,
          eventType: event.type,
          data: event.data,
          correlationId
        }, {
          attempts: 5,
          backoff: {
            type: 'custom',
          },
          removeOnComplete: true,
          removeOnFail: false
        }).catch(err => {
          this.logger.error(`[${correlationId}] Failed to add webhook job to queue:`, err);
          // Log but don't throw - event is saved, queue operation can retry
        });

        this.logger.log(`[${correlationId}] Job queued (async)`);
      // 1. check isEventAlreadyProcessed(event.id) -> if true, return early
      // 2. call saveEvent(event.id, event)
      // 3. add job to webhookQueue with event data (fire & forget)
    }
}