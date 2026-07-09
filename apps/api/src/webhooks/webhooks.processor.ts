import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Job, WorkerOptions } from "bullmq";
import { EmailService } from "src/email/email.service";

const customDelays = [
  60_000,    // Retry 1: 1 min
  300_000,   // Retry 2: 5 min
  1_800_000, // Retry 3: 30 min
  7_200_000, // Retry 4: 2 hours
  86_400_000 // Retry 5: 24 hours
];

@Processor('webhook-events', {
  settings: {
    backoffStrategy: (attemptsMade: number, type?: string, err?: Error, job?: Job): number => {
      if (type === 'custom') {
        const index = Math.min(attemptsMade - 1, customDelays.length - 1);
        return customDelays[index] ?? 1_000;
      }
      return 1000; 
    },
  }
} as WorkerOptions)

export class WebhooksProcessor extends WorkerHost {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private emailService: EmailService
  ) {
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

  async process(job: Job): Promise<any> {
    const { eventId, eventType, data } = job.data;
    console.log('🔥 Processing job:', eventType, eventId);

    switch(eventType) {
        case 'checkout.session.completed':
        await this.handlePaymentSucceeded(data);
        break;
    case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(data);
        break;
    default:
        console.log(`ℹ️ Unhandled webhook event type: ${eventType}. Skipping processing.`);
        // Mark as 'processed' so it doesn't stay stuck on 'pending'
        await this.updateEventStatus(eventId, 'processed', job.attemptsMade + 1);
        return { skipped: true };
    }

    await this.updateEventStatus(eventId, 'processed', job.attemptsMade + 1)
    return { success: true }
  }
  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    try {
    const maxAttempts = job.opts.attempts ?? 6;
    const isPermanentlyFailed = job.attemptsMade >= maxAttempts;

    if(isPermanentlyFailed) {
      console.error(`🚨 Webhook event ${job.data.eventId} permanently failed.`);

      // 1. Update Supabase record status to 'failed'
      await this.updateEventStatus(job.data.eventId, 'failed', job.attemptsMade);
      
        // 2. Trigger Admin Alert Notification
      await this.emailService.sendAdminAlert(
        `[DLQ Alert] Stripe Webhook Failed Permanently`,
        `Event ID: ${job.data.eventId}\nError: ${error.message}`
      );
    } else {
      // Optional: Log intermediate attempt count to DB if desired
      await this.supabase
        .from('webhook_events')
        .update({
          attempts: job.attemptsMade,
          error_message: `Attempt ${job.attemptsMade} failed: ${error.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', job.data.eventId);
    }
  } catch (dlqErr) {
      console.error('CRITICAL: Error inside onFailed event listener:', dlqErr);
    }
  }

  // @OnWorkerEvent('completed')
  // onCompleted(job: Job) {
  //   console.log(`✅ Job ${job.id} succeeded after ${job.attemptsMade} attempts.`);
  // }

  private async handlePaymentSucceeded(data: any): Promise<void> {
    const sessionId = data.object.id;
    console.log('Processing payment succeeded for session:', sessionId);

    const { error } = await this.supabase.from('purchases').update({status: 'completed'}).eq('payment_order_id', sessionId);
    
    if(error) {
        throw new Error(`Failed to update purchase status: ${error.message}`)
    }

    // Get purchase details for email
    const {data: purchase, error: fetchError} = await this.supabase.from('purchases').select('*, users(email), books(title, file_url)').eq('payment_order_id', sessionId).maybeSingle();

    if (fetchError || !purchase) {
      throw new Error(`Purchase record not found for session ID ${sessionId}: ${fetchError?.message}`);
    }

    if (!purchase.users?.email || !purchase.books?.title) {
      throw new Error(`Incomplete purchase relation data for session ID: ${sessionId}`);
    }

    if(purchase?.users?.email && purchase?.books?.title) {
      const { data: signedUrl, error: urlError } = await this.supabase.storage.from('ebooks').createSignedUrl(purchase.books.file_url, 60 * 60 * 24);

      if (urlError) {
        throw new Error(`Failed to create signed URL for ebook: ${urlError.message}`);
      }

      const downloadUrl = signedUrl?.signedUrl ?? purchase.books.file_url;

      await this.emailService.sendPurchaseConfirmation(
        purchase.users.email,
        purchase.books.title,
        downloadUrl,
      );
      console.log('purchase confirmation email sent to: ', purchase.users.email)
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

  private async updateEventStatus(eventId: string, status: string, attempts: number): Promise<void> {
    const { error } = await this.supabase.from('webhook_events').update({ status, attempts, updated_at: new Date().toISOString() }).eq('event_id', eventId);

    if(error) {
        throw new Error(`Failed to update webhook event status: ${error.message}`)
    }
    // update webhook_events row by event_id
  }
}