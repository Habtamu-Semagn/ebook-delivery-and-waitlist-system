import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Job, WorkerOptions } from "bullmq";
import { EmailService } from "src/email/email.service";
import * as Sentry from "@sentry/nestjs";
const customDelays = [
  60_000,    // Retry 1: 1 min
  300_000,   // Retry 2: 5 min
  1_800_000, // Retry 3: 30 min
  7_200_000, // Retry 4: 2 hours
  86_400_000 // Retry 5: 24 hours
];

@Processor('webhook-events', {
  settings: {
    backoffStrategy: (attemptsMade: number, type?: string): number => {
      if (type === 'custom') {
        const index = Math.min(attemptsMade - 1, customDelays.length - 1);
        return customDelays[index] ?? 1_000;
      }
      return 1000; 
    },
  }
} as WorkerOptions)

export class WebhooksProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhooksProcessor.name);
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
    const { eventId, eventType, data, correlationId } = job.data;
    this.logger.log(`[${correlationId}] 🔥 Processing job: ${eventType} (EVENT ID: ${eventId})`);

    try{
      switch(eventType) {
          case 'checkout.session.completed':
            await this.handlePaymentSucceeded(data, correlationId);
            break;
          case 'charge.succeeded':
            await this.handleChargeSucceeded(data, correlationId);
            break;
          case 'charge.updated':
            await this.handleChargeUpdated(data, correlationId);
            break;
          case 'payment_intent.payment_failed':
              await this.handlePaymentFailed(data, correlationId);
              break;
          default:
              this.logger.log(`ℹ️ Unhandled webhook event type: ${eventType}. Skipping processing.`);
              // Mark as 'processed' so it doesn't stay stuck on 'pending'
              await this.updateEventStatus(eventId, 'processed', job.attemptsMade + 1);
              return { skipped: true };
      }
  
      await this.updateEventStatus(eventId, 'processed', job.attemptsMade + 1)
      this.logger.log(`[${correlationId}] ✅ Event ${eventId} processed successfully.`)
      return { success: true }
    } catch (error) {
      this.logger.error(`[${correlationId}] Error processing job ${job.id} (Attempt ${job.attemptsMade}): ${(error as Error).message}`,
        (error as Error).stack);

      Sentry.captureException(error, {
        extra: {correlationId, eventId, eventType, jobId: job.id},
      });

      throw error;
    }
  }
  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    const { eventId, correlationId = 'N/A' } = job.data ?? {};

    try {
    const maxAttempts = job.opts.attempts ?? 6;
    const isPermanentlyFailed = job.attemptsMade >= maxAttempts;

    if(isPermanentlyFailed) {
      this.logger.error(`[${correlationId}] 🚨 Webhook event ${job.data.eventId} permanently failed.`);

      // 1. Update Supabase record status to 'failed'
      await this.updateEventStatus(job.data.eventId, 'failed', job.attemptsMade);
      
        // 2. Trigger Admin Alert Notification
      await this.emailService.sendAdminAlert(
        `[DLQ Alert] Stripe Webhook Failed Permanently`,
        `Correlation ID: ${correlationId}\nEvent ID: ${job.data.eventId}\nError: ${error.message}`
      );
    } else {
      this.logger.warn(`[${correlationId}] Attempt ${job.attemptsMade} failed for event ${eventId}. Will retry.`);

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
      this.logger.error(`[${correlationId}] CRITICAL: Error inside onFailed event listener:`, (dlqErr as Error).stack);
    }
  }

  // @OnWorkerEvent('completed')
  // onCompleted(job: Job) {
  //   console.log(`✅ Job ${job.id} succeeded after ${job.attemptsMade} attempts.`);
  // }

  private async handlePaymentSucceeded(data: any, correlationId: string): Promise<void> {
    const sessionId = data.object.id;
    this.logger.log(`${correlationId}] Processing payment succeeded for session: ${sessionId}`);

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
      this.logger.log(`[${correlationId}] purchase confirmation email sent to: ${purchase.users.email}`)
    }
    // update purchases table: status = 'completed'
    // (later: trigger confirmation email - Day 5)
  }

  private async handleChargeSucceeded(data: any, correlationId: string): Promise<void> {
    const chargeId = data.object.id;
    const paymentIntentId = data.object.payment_intent;
    
    this.logger.log(`[${correlationId}] Processing charge succeeded: ${chargeId}, Payment Intent: ${paymentIntentId}`);

    // Try to find purchase by payment_intent_id (stored in payment_order_id or a dedicated column)
    const { data: purchase, error: fetchError } = await this.supabase
      .from('purchases')
      .select('*, users(email), books(title, file_url)')
      .eq('payment_order_id', paymentIntentId)
      .maybeSingle();

    if (fetchError) {
      this.logger.warn(`[${correlationId}] Could not find purchase for payment intent: ${paymentIntentId}`);
      return; // Not an error - might be handled by checkout.session.completed
    }

    if (!purchase) {
      this.logger.log(`[${correlationId}] No purchase found for this charge - likely already processed`);
      return;
    }

    // Update status to completed
    const { error: updateError } = await this.supabase
      .from('purchases')
      .update({ status: 'completed' })
      .eq('id', purchase.id);

    if (updateError) {
      throw new Error(`Failed to update purchase status: ${updateError.message}`);
    }

    // Send email if not already sent
    if (purchase?.users?.email && purchase?.books?.title) {
      const { data: signedUrl, error: urlError } = await this.supabase.storage
        .from('ebooks')
        .createSignedUrl(purchase.books.file_url, 60 * 60 * 24);

      if (urlError) {
        throw new Error(`Failed to create signed URL for ebook: ${urlError.message}`);
      }

      const downloadUrl = signedUrl?.signedUrl ?? purchase.books.file_url;

      await this.emailService.sendPurchaseConfirmation(
        purchase.users.email,
        purchase.books.title,
        downloadUrl,
      );
      
      this.logger.log(`[${correlationId}] Purchase confirmation email sent to: ${purchase.users.email}`);
    }
  }

  private async handleChargeUpdated(data: any, correlationId: string): Promise<void> {
    const chargeId = data.object.id;
    const paymentIntentId = data.object.payment_intent;
    const status = data.object.status;
    const paid = data.object.paid;
    
    this.logger.log(`[${correlationId}] Processing charge updated: ${chargeId}, Status: ${status}, Paid: ${paid}`);

    // Only process if the charge is successful and paid
    if (status !== 'succeeded' || !paid) {
      this.logger.log(`[${correlationId}] Charge not yet successful (status: ${status}, paid: ${paid}). Skipping.`);
      return;
    }

    // Try to find purchase by payment_intent_id
    const { data: purchase, error: fetchError } = await this.supabase
      .from('purchases')
      .select('*, users(email), books(title, file_url)')
      .eq('payment_order_id', paymentIntentId)
      .maybeSingle();

    if (fetchError) {
      this.logger.warn(`[${correlationId}] Could not find purchase for payment intent: ${paymentIntentId}`);
      return;
    }

    if (!purchase) {
      this.logger.log(`[${correlationId}] No purchase found for this charge`);
      return;
    }

    // Check if already completed to avoid duplicate emails
    if (purchase.status === 'completed') {
      this.logger.log(`[${correlationId}] Purchase already completed. Skipping.`);
      return;
    }

    // Update status to completed
    const { error: updateError } = await this.supabase
      .from('purchases')
      .update({ status: 'completed' })
      .eq('id', purchase.id);

    if (updateError) {
      throw new Error(`Failed to update purchase status: ${updateError.message}`);
    }

    // Send email
    if (purchase?.users?.email && purchase?.books?.title) {
      const { data: signedUrl, error: urlError } = await this.supabase.storage
        .from('ebooks')
        .createSignedUrl(purchase.books.file_url, 60 * 60 * 24);

      if (urlError) {
        throw new Error(`Failed to create signed URL for ebook: ${urlError.message}`);
      }

      const downloadUrl = signedUrl?.signedUrl ?? purchase.books.file_url;

      await this.emailService.sendPurchaseConfirmation(
        purchase.users.email,
        purchase.books.title,
        downloadUrl,
      );
      
      this.logger.log(`[${correlationId}] Purchase confirmation email sent to: ${purchase.users.email}`);
    }
  }

  private async handlePaymentFailed(data: any, correlationId: string): Promise<void> {
    const paymentIntentId = data.object.id;
    this.logger.log(`[${correlationId}] Processing payment failed for intent: ${paymentIntentId}`);

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