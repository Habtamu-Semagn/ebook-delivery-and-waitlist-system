import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BooksService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
        
        console.log('🔑 Initializing Supabase client with:');
        console.log('  URL:', supabaseUrl);
        console.log('  Service Role Key (first 20 chars):', serviceRoleKey.substring(0, 20) + '...');
        
        this.supabase = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                realtime: {
                    transport: require('ws')
                }
            }
        )
    }

    async getAllBooks() {
        const {data, error} = await this.supabase.from('books').select('id, title, description, price, is_active, author, category, image_url').eq('is_active', true)

        if(error) {
            throw new Error(`Failed to fetch books: ${error.message}`)
        }

        return data;
    }

    async getBooksByCategory(categorySlug: string) {
        try {
            const {data, error} = await this.supabase
                .from('books')
                .select('id, title, description, price, is_active, author, category, image_url')
                .eq('is_active', true)
                .eq('category', categorySlug)
                .order('created_at', { ascending: false });

            if(error) {
                console.error('Error fetching books by category:', error.message);
                // Return empty array instead of throwing - graceful degradation
                // This handles cases where the category column doesn't exist yet
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('Exception in getBooksByCategory:', err);
            // Return empty array for any unexpected errors
            return [];
        }
    }

    async getBookById(bookId: string) {
        // Validate UUID format manually
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(bookId)) {
            // Not a valid UUID - return empty to let category handler work
            return [];
        }

        try {
            const {data, error} = await this.supabase.from('books').select('id, title, description, price, author, is_active, category, image_url').eq('id', bookId).eq('is_active', true).maybeSingle();

            if(error) {
                throw new Error(`Failed to fetch book: ${error.message}`);
            }

            if(!data) {
                throw new NotFoundException('Book not found');
            }

            return data;
        } catch (err: any) {
            throw err;
        }
    }

    async generateDownloadUrl(bookId: string, firebaseUid: string, ipAddress: string): Promise<{ downloadUrl: string }> {
        console.log('--- 🚀 DOWNLOAD ATTEMPT START ---');
        console.log('Firebase UID:', firebaseUid);
        console.log('Book ID:', bookId);
        // Get the user data from supabse
        const {data: user} = await this.supabase.from('users').select('id').eq('firebase_uid', firebaseUid).maybeSingle();
        console.log('User found in DB:', user);

        if(!user) {
            throw new NotFoundException('User not found');
        }

        // RATE LIMIT: 5 requests per hour per user per book
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await this.supabase
            .from('download_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('book_id', bookId)
            .eq('status', 'success')
            .gte('created_at', oneHourAgo);
        console.log('Current rate limit count:', count, 'Error:', countError);

        if (countError) {
            console.error('Download log check failed:', countError);
            throw new Error(`Rate limit check failed: ${countError.message}`);
        }

        if (count && count >= 5) {
            console.log('🛑 RATE LIMIT TRIGGERED!');
            await this.logDownloadAttempt(user.id, bookId, ipAddress, 'rate_limited');
            throw new HttpException('Download limit reached. You can download 5 times per hour.', HttpStatus.TOO_MANY_REQUESTS);
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

        await this.logDownloadAttempt(user.id, bookId, ipAddress, 'success');

        return { downloadUrl: signedUrl.signedUrl };
    }

    private async logDownloadAttempt(userId: string, bookId: string, ipAddress: string, status: string) {
        const { error } = await this.supabase.from('download_logs').insert({
            user_id: userId,
            book_id: bookId,
            ip_address: ipAddress,
            status: status
        })
        if (error) {
        console.error('❌ FAILED TO WRITE TO DOWNLOAD_LOGS:', error.message);
    } else {
        console.log('✅ Successfully wrote log to DB for status:', status);
    }
    }

    async uploadBook(file: Express.Multer.File, bookData: { title: string; description: string; author: string; price: number; category: string }, imageFile?: Express.Multer.File) {
        const fileName = `${Date.now()}-${file.originalname}`;
        
        console.log('📤 Starting file upload:', fileName);
        console.log('  File size:', file.size, 'bytes');
        console.log('  Content type:', file.mimetype);
        console.log('  Book data:', bookData);
        console.log('  Image file:', imageFile ? `${imageFile.originalname} (${imageFile.size} bytes)` : 'None');
        
        let imageFileName: string | null = null;

        try {
            // Upload image first if provided
            if (imageFile) {
                imageFileName = `${Date.now()}-${imageFile.originalname}`;
                console.log('📷 Uploading cover image:', imageFileName);

                const { data: imageUploadData, error: imageUploadError } = await this.supabase.storage
                    .from('book-images')
                    .upload(imageFileName, imageFile.buffer, {
                        contentType: imageFile.mimetype,
                        upsert: false
                    });

                if (imageUploadError) {
                    console.error('❌ Image upload error:', imageUploadError);
                    throw new Error(`Failed to upload image: ${imageUploadError.message}`);
                }

                console.log('✅ Image uploaded successfully:', imageUploadData);
            }

            // Upload PDF file to Supabase storage
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('ebooks')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('❌ PDF upload error:', uploadError);
                // Rollback: delete uploaded image if it exists
                if (imageFileName) {
                    await this.supabase.storage.from('book-images').remove([imageFileName]);
                }
                throw new Error(`Failed to upload file: ${uploadError.message}`);
            }

            console.log('✅ PDF uploaded successfully:', uploadData);

            // Insert book record into database
            const { data: book, error: dbError } = await this.supabase
                .from('books')
                .insert({
                    title: bookData.title,
                    description: bookData.description,
                    author: bookData.author,
                    price: bookData.price,
                    category: bookData.category,
                    file_url: fileName,
                    image_url: imageFileName,
                    is_active: true
                })
                .select()
                .single();

            if (dbError) {
                console.error('❌ Database error:', dbError);
                // Rollback: delete both uploaded files
                await this.supabase.storage.from('ebooks').remove([fileName]);
                if (imageFileName) {
                    await this.supabase.storage.from('book-images').remove([imageFileName]);
                }
                throw new Error(`Failed to create book record: ${dbError.message}`);
            }

            console.log('✅ Book record created:', book.id);
            return { success: true, book };
        } catch (error) {
            console.error('❌ Unexpected error in uploadBook:', error);
            throw error;
        }
    }
}
