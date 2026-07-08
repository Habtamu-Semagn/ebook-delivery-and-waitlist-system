import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class PurchasesService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        this.supabase = createClient(
            this.configService.getOrThrow<string>('SUPABASE_URL'),
            this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
            {
                realtime: {
                    transport: require('ws')
                }
            }
        )
    }

    async getPurchasesByUser(firebaseUid: string) {
        // Get user from supabase
        const {data: user } = await this.supabase.from('users').select('id').eq('firebase_uid', firebaseUid).maybeSingle();

        if(!user) {
            throw new NotFoundException('User not found');
        }

        // Get all purchases (including pending ones for MVP)
        const {data: purchases, error} = await this.supabase.from('purchases')
            .select(`
                id,
                book_id,
                status,
                created_at,
                books:book_id (
                    id,
                    title,
                    author,
                    price
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if(error) {
            throw new Error(`Failed to fetch purchases: ${error.message}`);
        }

        return purchases || [];
    }
}
