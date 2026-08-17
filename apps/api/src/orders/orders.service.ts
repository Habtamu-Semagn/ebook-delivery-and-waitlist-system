import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import  Stripe from 'stripe';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class OrdersService {
    private supabase: SupabaseClient;
    private stripe: Stripe;
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private configService: ConfigService,
        private emailService: EmailService,
    ) {
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
        try {
            // Get user from supabase
            const {data: user } = await this.supabase.from('users').select('id, email').eq('firebase_uid', firebaseUid).maybeSingle();

            if(!user) {
                throw new NotFoundException('User not found');
            }

            // Get book details
            const {data: book} = await this.supabase.from('books').select('id, title, price, file_url').eq('id', bookId).eq('is_active', true).maybeSingle();

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
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
                metadata:{
                    bookId: book.id,
                    UserId: user.id,
                }
            });

            // Verify session was created successfully
            if (!session || !session.id) {
                throw new BadRequestException('Failed to create Stripe checkout session');
            }

            // Save purchase record with pending status
            const {data: purchase, error} = await this.supabase.from('purchases').insert({
                user_id: user.id,
                book_id: book.id,
                status: 'pending',
                payment_order_id: session.id,
            }).select('id').maybeSingle();

            if(error) {
                this.logger.error(`Failed to create purchase record: ${error.message}`);
                throw new BadRequestException(`Failed to create purchase record: ${error.message}`);
            }

            this.logger.log(`Created purchase record: ${JSON.stringify(purchase)} \nCreated session: ${JSON.stringify(session)}`)

            // For MVP testing: immediately mark as completed since webhook won't work in local dev
            // In production, the Stripe webhook (checkout.session.completed) will handle this
            // Only auto-complete if: (1) running in dev/test mode AND (2) session created successfully
            if(process.env.NODE_ENV !== 'production' && session.id && purchase?.id) {
                await this.supabase.from('purchases')
                    .update({ status: 'completed' })
                    .eq('id', purchase.id);
                
                // Generate signed URL and send email in dev mode
                const { data: signedUrl } = await this.supabase.storage.from('ebooks').createSignedUrl(book.file_url, 60 * 60 * 24);
                const downloadUrl = signedUrl?.signedUrl ?? book.file_url;
                
                await this.emailService.sendPurchaseConfirmation(
                    user.email,
                    book.title,
                    downloadUrl,
                );
                
                this.logger.log(`[DEV] Auto-completed purchase and sent email for testing: ${purchase.id}`);
            }

            this.logger.log(`Order created for user ${user.id}, book ${book.id}, session ${session.id}`);

            // Return session url and id to frontend
            return {
                sessionId: session.id,
                sessionUrl: session.url,
            }
        } catch (error) {
            this.logger.error(`Error creating order: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
            throw error;
        }
    }
}
