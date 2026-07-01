import { BadRequestException, Controller, Headers, Post, Req } from '@nestjs/common';

import { WebhooksService } from './webhooks.service';
import type { RawBodyRequest } from '@nestjs/common';
import type {Request} from 'express';

@Controller('webhooks')
export class WebhooksController {
    constructor(private webhooksSerivce: WebhooksService) {}

    @Post('stripe')
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>, 
        @Headers('stripe-signature') signature: string
    ): Promise<{received: boolean}>
    {
        const rawBody = req.rawBody;
        if(!rawBody) {
            throw new BadRequestException('Missing raw body');
        }
        if(!signature) {
            throw new BadRequestException('Missing stripe-signature header')
        }
        try {
            const event = this.webhooksSerivce.verifySignature(rawBody, signature);
            await this.webhooksSerivce.processEvent(event);
            return { received: true};
        } catch (err) {
            throw new BadRequestException(`webhook signature verification failed: ${err}`)
        }
    }
}