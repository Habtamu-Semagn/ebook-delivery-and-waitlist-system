import { BadRequestException, Controller, Headers, Post, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import type { RawBodyRequest } from '@nestjs/common';
import type {Request} from 'express';
import { randomUUID } from 'crypto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(private readonly webhooksSerivce: WebhooksService) {}

    @Post('stripe')
    @ApiOperation({ summary: 'Handle Stripe webhook events (payment.captured, payment.failed)' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid signature or missing headers' })
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>, 
        @Headers('stripe-signature') signature: string,
        @Headers('x-correlation-id') incomingCorrelationId?: string
    ): Promise<{received: boolean}>
    {
        // Resolve or assign correlation Id
        const correlationId = incomingCorrelationId || randomUUID();

        this.logger.log(`[${correlationId}] Received request to /webhooks/stripe`);
        this.logger.log(`[${correlationId}] Headers: ${JSON.stringify(req.headers)}`);
        this.logger.log(`[${correlationId}] Body type: ${typeof req.rawBody}, size: ${req.rawBody?.length}`);
        
        const rawBody = req.rawBody;
        if(!rawBody) {
            this.logger.error('[${correlationId}] Missing raw body');
            throw new BadRequestException('Missing raw body');
        }
        if(!signature) {
            this.logger.error(`[${correlationId}] Missing stripe-signature header`);
            throw new BadRequestException('Missing stripe-signature header')
        }
        try {
            this.logger.log(`[${correlationId}] Verifying Stripe signature...`);
            const event = this.webhooksSerivce.verifySignature(rawBody, signature);
            this.logger.log(`[${correlationId}] Signature verified. Event type: ${event.type}`);
            
            await this.webhooksSerivce.processEvent(event, correlationId);
            this.logger.log(`[${correlationId}] Event processed successfully`);
            
            return { received: true};
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
            this.logger.error(`[${correlationId}] Error: ${errorMessage}`);
            throw new BadRequestException(`webhook signature verification failed: ${errorMessage}`)
        }
    }
}