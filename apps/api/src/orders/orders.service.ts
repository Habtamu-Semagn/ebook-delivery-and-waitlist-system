import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import  Stripe from 'stripe';

@Injectable()
export class OrdersService {
    private supabase: SupabaseClient;
    private stripe: Stripe;

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
        
        this.stripe = new Stripe(
            this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
        )
    }

    async createOrder(bookId: string, firebaseUid: string) {
        // Get user from supabase
        const {data: user } = await this.supabase.from('users').select('id, email').eq('firebase_uid', firebaseUid).maybeSingle();

        if(!user) {
            throw new NotFoundException('User not found');
        }

        // Get book details
        const {data: book} = await this.supabase.from('books').select('id, title, price').eq('id', bookId).eq('is_active', true).maybeSingle();

        if(!book) {
            throw new NotFoundException('Book not found');
        }

        // Create stripe checkout session
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: book.title,
                        },
                        unit_amount: book.price,
                    },
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3000/cancel',
            metadata:{
                bookId: book.id,
                UserId: user.id,
            }
        });

        // Save purchase record with pending status
        const {error} = await this.supabase.from('purchases').insert({
            user_id: user.id,
            book_id: book.id,
            status: 'pending',
            payment_order_id: session.id,
        })

        if(error) {
            throw new Error(`Failed to create purchase record: ${error.message}`);
        }

        // Return session url and id to frontend
        return {
            sessionId: session.id,
            sessionUrl: session.url,
        }
    }
}
