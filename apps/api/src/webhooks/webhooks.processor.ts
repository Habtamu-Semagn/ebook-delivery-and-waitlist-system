import { Processor, WorkerHost } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Job } from "bullmq";

@Processor('webhook-events')
export class WebhooksProcessor extends WorkerHost {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    super();
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      {
        realtime: {
          transport: require('ws'),
        },
      },
    );
  }

  async process(job: Job): Promise<void> {
    const { eventId, eventType, data } = job.data;
    try {

        switch(eventType) {
            case 'checkout.session.completed':
            await this.handlePaymentSucceeded(data);
            break;
        case 'payment_intent.payment':
            await this.handlePaymentFailed(data);
            break;
        default:
            console.log("unhandled webhook event type: ", eventType);
        }

        await this.updateEventStatus(eventId, 'processed')
    } catch (err) {
        await this.updateEventStatus(eventId, 'failed');
        throw err;
    }
  }

  private async handlePaymentSucceeded(data: any): Promise<void> {
    const sessionId = data.object.id;

    const { error } = await this.supabase.from('purchases').update({status: 'completed'}).eq('payment_order_id', sessionId);
    
    if(error) {
        throw new Error(`Failed to update purchase status: ${error.message}`)
    }
    // update purchases table: status = 'completed'
    // (later: trigger confirmation email - Day 5)
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    const paymentIntentId = data.object.id;

    const { error } = await this.supabase.from('purchases').update({status: 'failed'}).eq('payment_id', paymentIntentId);  

    if(error) {
        throw new Error(`Failed to update purchase status: ${error.message}`);
    }
    // update purchases table: status = 'failed'
  }

  private async updateEventStatus(eventId: string, status: string): Promise<void> {
    const { error } = await this.supabase.from('webhook_events').update({ status }).eq('event_id', eventId);

    if(error) {
        throw new Error(`Failed to update webhook event status: ${error.message}`)
    }
    // update webhook_events row by event_id
  }
}