import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin.guard';
import { PurchasesService } from 'src/purchases/purchases.service';
import { WaitlistService } from 'src/waitlist/waitlist.service';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    private supabase: SupabaseClient;

    constructor(
        private purchasesService: PurchasesService,
        private waitlistService: WaitlistService,
        private usersService: UsersService,
        private emailService: EmailService,
        private configService: ConfigService,
    ) {
        this.supabase = createClient(
            this.configService.getOrThrow<string>('SUPABASE_URL'),
            this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
        );
    }

    @Get('ping')
    ping() {
        return { ok: true, message: 'You are an authenticated admin'}
    }

    @Get('dashboard/stats')
    async getDashboardStats() {
        const [totalRevenue, totalPurchases, waitlistCount, recentPurchases] = await Promise.all([
            this.purchasesService.getTotalRevenue(),
            this.purchasesService.getTotalCount(),
            this.waitlistService.getTotalCount(),
            this.purchasesService.getRecentPurchases(5),
        ]);

        return {
            totalRevenue,
            totalPurchases,
            waitlistCount,
            recentPurchases,
        };
    }

    @Get('purchases')
    async getAllPurchases() {
        return this.purchasesService.getAllPurchases();
    }

    @Get('users')
    async getAllUsers() {
        return this.usersService.getAllUsers();
    }

    @Get('webhooks')
    async getAllWebhooks() {
        const { data, error } = await this.supabase
            .from('webhook_events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch webhooks');
        }

        return data || [];
    }

    @Post('webhooks/:webhookId/retry')
    async retryWebhook(@Param('webhookId') webhookId: string) {
        // Fetch the current retry count and increment it
        const { data: webhook } = await this.supabase
            .from('webhook_events')
            .select('*')
            .eq('id', webhookId)
            .single();

        if (!webhook) {
            throw new Error('Webhook event not found');
        }

        const { error } = await this.supabase
            .from('webhook_events')
            .update({ status: 'pending' })
            .eq('id', webhookId);

        if (error) {
            throw new Error('Failed to retry webhook');
        }

        return { success: true, message: 'Webhook retry queued' };
    }
}
