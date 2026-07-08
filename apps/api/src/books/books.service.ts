import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BooksService {
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

    async getAllBooks() {
        const {data, error} = await this.supabase.from('books').select('id, title, description, price, is_active, author').eq('is_active', true)

        if(error) {
            throw new Error(`Failed to fetch books: ${error.message}`)
        }

        return data;
    }

    async getBookById(bookId: string) {
        const {data, error} = await this.supabase.from('books').select('id, title, description, price, author, is_active').eq('id', bookId).eq('is_active', true).maybeSingle();

        if(error) {
            throw new Error(`Failed to fetch book: ${error.message}`);
        }

        if(!data) {
            throw new NotFoundException('Book not found');
        }

        return data;
    }

    async generateDownloadUrl(bookId: string, firebaseUid: string): Promise<{ downloadUrl: string }> {
        // Get the user data from supabse
        const {data: user} = await this.supabase.from('users').select('id').eq('firebase_uid', firebaseUid).maybeSingle();

        if(!user) {
            throw new NotFoundException('User not found');
        }

        // Check if the user has completed a purchase for the book
        const {data: purchase} = await this.supabase.from('purchases').select('id').eq('user_id', user.id).eq('book_id', bookId).eq('status', 'completed').maybeSingle();

        if(!purchase) {
            throw new ForbiddenException('You have not purchased this book')
        }

        // Get the book file path
        const { data: book } = await this.supabase.from('books').select('file_url').eq('id', bookId).maybeSingle();

        if(!book) {
            throw new NotFoundException('Book not found');
        }

        // Generate signed URL (expires in 24 hours)
        const {data: signedUrl, error} = await this.supabase.storage.from('ebooks').createSignedUrl(book.file_url, 60*60*24);

        if(error || !signedUrl) {
            throw new Error(`Failed to generate download url: ${error?.message}`)
        }

        return { downloadUrl: signedUrl.signedUrl };
    }
}
