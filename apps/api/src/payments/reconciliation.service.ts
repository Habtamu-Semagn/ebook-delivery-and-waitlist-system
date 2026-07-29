import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { EmailService } from "../email/email.service";
import Stripe from "stripe";
@Injectable()
export class ReconciliationService {
    private readonly logger = new Logger(ReconciliationService.name);
    private stripe: Stripe;
    private supabase: SupabaseClient;
    constructor(
        private configService: ConfigService,
        private emailService: EmailService,
    ) {
        this.stripe = new Stripe(
            this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
        );
        if (!globalThis.WebSocket) {
            (globalThis as any).WebSocket = class {};
        }
        this.supabase = createClient(
            this.configService.getOrThrow<string>('SUPABASE_URL'),
            this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY')
        ),
        {
        auth: {
            persistSession: false,
        }
    }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async reconcilePendingPayments(): Promise<void> {
        const runId = `rec_${Date.now()}`;
        this.logger.log(`🔄 [${runId}] Starting Stripe payment reconciliation run...`)

        const stats = {
            evaluated: 0,
            autoFulfilled: 0,
            markedFailed: 0,
            errors: 0,
        };

        try {
            // Fetch Pending purchases
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

            const { data: PendingPurchases, error} = await this.supabase.from('purchases').select('*, users(email), books(title, file_url)').eq('status', 'pending').lt('created_at', twoHoursAgo);

            if(error) {
                throw new Error(`Failed to fetch pending purchases: ${error.message}`);
            }

            if(!PendingPurchases || PendingPurchases.length === 0) {
                this.logger.log(`✅ [${runId}] No stuck pending payments found.`);
                await this.logReconciliationRun(runId, stats);
                return;
            }

            stats.evaluated = PendingPurchases.length;
            this.logger.warn(
        `⚠️ [${runId}] Found ${stats.evaluated} payments stuck in pending > 2h. Verifying with Stripe...`,
      );

        // Verify each stuch purchase
        for (const purchase of PendingPurchases) {
            try {
                const sessionId = purchase.payment_order_id;

                if(!sessionId) {
                    this.logger.error(`[${runId}] Purchase ${purchase.id} missing Stripe session ID.`);
                    stats.errors++;
                    continue;
                }

                const session = await this.stripe.checkout.sessions.retrieve(sessionId);

                if(session.payment_status === 'paid') {
                    this.logger.log(`⚡ [${runId}] Session ${sessionId} is PAID in Stripe. Auto-fulfilling...`,);
                    await this.fulfillPurchase(purchase, runId);
                    stats.autoFulfilled++;
                } else if(session.status === 'expired') {
                    await this.supabase.from('purchases').update({status:'failed', updated_at: new Date().toISOString()}).eq('id', purchase.id);
                    stats.markedFailed++;
                }
            } catch(err: any) {
                this.logger.error(`❌ [${runId}] Error reconciling purchase ID ${purchase.id}: ${err.message}`);
                stats.errors++;
            }
        }

        // Audit log
        await this.logReconciliationRun(runId, stats);
        this.logger.log(`🏁 [${runId}] Reconciliation completed. Stats: ${JSON.stringify(stats)}`);
        } catch(err: any) {
         this.logger.error(`CRITICAL: Reconciliation job crashed: ${err.message}`);
         }
    }
    private async fulfillPurchase(purchase: any, runId: string): Promise<void> {
        const { error: updateError } = await this.supabase
          .from('purchases')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', purchase.id);
        if (updateError) {
            throw new Error(`Failed to update purchase status: ${updateError.message}`);
        }
        if (purchase?.users?.email && purchase?.books?.title) {
      const { data: signedUrl } = await this.supabase.storage
        .from('ebooks')
        .createSignedUrl(purchase.books.file_url, 60 * 60 * 24);

      const downloadUrl = signedUrl?.signedUrl ?? purchase.books.file_url;

      await this.emailService.sendPurchaseConfirmation(
        purchase.users.email,
        purchase.books.title,
        downloadUrl,
      );

      this.logger.log(`📧 [${runId}] Purchase confirmation emailed to ${purchase.users.email}`);
    }
    }
    private async logReconciliationRun(runId: string, stats: Record<string, number>): Promise<void> {
        await this.supabase.from('reconciliation_logs').insert({
          run_id: runId,
          evaluated_count: stats.evaluated,
          auto_fulfilled_count: stats.autoFulfilled,
          marked_failed_count: stats.markedFailed,
          error_count: stats.errors,
          created_at: new Date().toISOString(),
        });
    }
}
