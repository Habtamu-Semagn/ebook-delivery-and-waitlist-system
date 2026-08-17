import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class WaitlistService {
    private supabase: SupabaseClient;

    constructor(
        private configService: ConfigService,
        private emailService: EmailService,
    ) {
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

    async joinWaitlist(email: string) {
        const { data: existing } = await this.supabase.from('waitlist').select('id').eq('email', email).maybeSingle();

        if(existing) {
            const { count } = await this.supabase.from('waitlist').select('*', { count: 'exact', head: true}).lte('created_at', (await this.supabase.from('waitlist').select('created_at').eq('email', email).single()).data?.created_at);

            return {
                message: "You're already on the list!",
                position: count,
            }
        }

        const { error } = await this.supabase.from('waitlist').insert({email});

        if(error ) {
            throw new Error(`Failed to join waitlist: ${error.message}`);
        }

        const { count } = await this.supabase.from('waitlist').select('*', { count: 'exact', head: true });

        await this.emailService.sendWaitlistConfirmation(email);

        return {
            message: `You're #${count} on the list!`,
            position: count,
        }
    }

    async getWaitlistCount() {
        const { count } = await this.supabase.from('waitlist').select('*', { count: 'exact', head: true });

        return { count };
    }

    async getTotalCount() {
        const { count } = await this.supabase.from('waitlist').select('*', { count: 'exact', head: true });

        return count || 0;
    }
}
