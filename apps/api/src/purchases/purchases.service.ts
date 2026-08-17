import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class PurchasesService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(PurchasesService.name);

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
        },
      }
    );
  }

  async getPurchasesByUser(firebaseUid: string) {
    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { data: purchases, error } = await this.supabase
      .from('purchases')
      .select('*, books(id, title, author)')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (error) {
      this.logger.error(`Failed to fetch purchases: ${error.message}`);
      throw new BadRequestException('Failed to fetch purchases');
    }

    return purchases || [];
  }

  async getDownloadUrl(firebaseUid: string, bookId: string): Promise<{ downloadUrl: string }> {
    // Verify user owns this purchase
    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has completed purchase for this book
    const { data: purchase, error: purchaseError } = await this.supabase
      .from('purchases')
      .select('*, books(file_url)')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .eq('status', 'completed')
      .maybeSingle();

    // Invalid UUID format or database errors should be treated as access denied
    if (purchaseError) {
      this.logger.error(`Failed to fetch purchase: ${purchaseError.message}`);
      throw new ForbiddenException('You do not have access to this book');
    }

    if (!purchase) {
      throw new ForbiddenException('You do not have access to this book');
    }

    const fileUrl = purchase.books?.file_url;
    if (!fileUrl) {
      throw new BadRequestException('Book file not found');
    }

    // Generate signed URL with 24 hour expiration
    const { data: signedUrl, error: urlError } = await this.supabase.storage
      .from('ebooks')
      .createSignedUrl(fileUrl, 60 * 60 * 24); // 24 hours in seconds

    if (urlError || !signedUrl) {
      this.logger.error(`Failed to create signed URL: ${urlError?.message}`);
      throw new BadRequestException('Failed to generate download URL');
    }

    this.logger.log(
      `Generated signed URL for user ${user.id}, book ${bookId}, expires in 24 hours`
    );

    return {
      downloadUrl: signedUrl.signedUrl,
    };
  }

  async getTotalRevenue() {
    const { data, error } = await this.supabase
      .from('purchases')
      .select('books(price)')
      .eq('status', 'completed');

    if (error) {
      this.logger.error(`Failed to fetch total revenue: ${error.message}`);
      return 0;
    }

    const total = (data || []).reduce((sum, purchase: any) => sum + (purchase.books?.[0]?.price || 0), 0);
    return total / 100; // Convert from cents to dollars
  }

  async getTotalCount() {
    const { count, error } = await this.supabase
      .from('purchases')
      .select('*', { count: 'exact' })
      .eq('status', 'completed');

    if (error) {
      this.logger.error(`Failed to fetch purchase count: ${error.message}`);
      return 0;
    }

    return count || 0;
  }

  async getRecentPurchases(limit: number = 5) {
    const { data, error } = await this.supabase
      .from('purchases')
      .select('*, users(email), books(title)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Failed to fetch recent purchases: ${error.message}`);
      return [];
    }

    return data || [];
  }

  async getAllPurchases() {
    const { data, error } = await this.supabase
      .from('purchases')
      .select('*, users(email), books(title)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch all purchases: ${error.message}`);
      return [];
    }

    return data || [];
  }

  async resendConfirmationEmail(purchaseId: string) {
    const { data: purchase, error } = await this.supabase
      .from('purchases')
      .select('*, users(email), books(title, file_url)')
      .eq('id', purchaseId)
      .maybeSingle();

    if (error || !purchase) {
      this.logger.error(`Failed to fetch purchase: ${error?.message}`);
      throw new Error('Purchase not found');
    }

    // Generate signed URL for download
    const fileUrl = purchase.books?.file_url;
    let signedUrl = '';

    if (fileUrl) {
      const { data: url, error: urlError } = await this.supabase.storage
        .from('ebooks')
        .createSignedUrl(fileUrl, 60 * 60 * 24);

      if (url) {
        signedUrl = url.signedUrl;
      }
    }

    // Send confirmation email with download link
    await this.emailService.sendPurchaseConfirmation(
      purchase.users?.email,
      purchase.books?.title,
      signedUrl,
    );

    this.logger.log(`Resent confirmation email for purchase ${purchaseId}`);
    return { success: true, message: 'Email resent successfully' };
  }
}
