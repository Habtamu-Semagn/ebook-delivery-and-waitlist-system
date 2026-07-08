import { BadRequestException, Controller, Headers, Post, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import type { RawBodyRequest } from '@nestjs/common';
import type {Request} from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private webhooksSerivce: WebhooksService) {}

    @Post('stripe')
    @ApiOperation({ summary: 'Handle Stripe webhook events (payment.captured, payment.failed)' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid signature or missing headers' })
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>, 
        @Headers('stripe-signature') signature: string
    ): Promise<{received: boolean}>
    {
        this.logger.log(`[WEBHOOK] Received request to /webhooks/stripe`);
        this.logger.log(`[WEBHOOK] Headers: ${JSON.stringify(req.headers)}`);
        this.logger.log(`[WEBHOOK] Body type: ${typeof req.rawBody}, size: ${req.rawBody?.length}`);
        
        const rawBody = req.rawBody;
        if(!rawBody) {
            this.logger.error('[WEBHOOK] Missing raw body');
            throw new BadRequestException('Missing raw body');
        }
        if(!signature) {
            this.logger.error('[WEBHOOK] Missing stripe-signature header');
            throw new BadRequestException('Missing stripe-signature header')
        }
        try {
            this.logger.log('[WEBHOOK] Verifying Stripe signature...');
            const event = this.webhooksSerivce.verifySignature(rawBody, signature);
            this.logger.log(`[WEBHOOK] Signature verified. Event type: ${event.type}`);
            
            await this.webhooksSerivce.processEvent(event);
            this.logger.log(`[WEBHOOK] Event processed successfully`);
            
            return { received: true};
        } catch (err) {
            this.logger.error(`[WEBHOOK] Error: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
            throw new BadRequestException(`webhook signature verification failed: ${err}`)
        }
    }
}