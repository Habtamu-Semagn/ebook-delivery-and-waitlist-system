import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;
    private fromEmail: string;

    constructor(private configService: ConfigService) {
        this.resend = new Resend(
            this.configService.getOrThrow<string>('RESEND_API_KEY')
        );
        this.fromEmail = this.configService.get<string>('FROM_EMAIL', 'onboarding@resend.dev')
    }

    async sendPurchaseConfirmation(
        to: string,
        bookTitle: string,
        downloadUrl: string,
    ): Promise<void> {
        console.log(`Sending purchase confirmation to ${to} for book ${bookTitle}`);
        
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: `Your purchase of "${bookTitle}" is confirmed!`,
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Thank you for your purchase!</h1>
                <p>Your purchase of <strong>${bookTitle}</strong> has been confirmed.</p>
                <p>Click the button below to download your ebook:</p>
                <a 
                  href="${downloadUrl}" 
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #2563eb;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin-top: 16px;
                  "
                >
                  Download Ebook
                </a>
                <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                  If the button doesn't work, copy and paste this link: ${downloadUrl}
                </p>
               </div>
             `,
            });
            
            console.log(`✅ Email sent successfully! ID: ${result.data?.id}, Error: ${result.error?.message || 'none'}`);
            
            if (result.error) {
                throw new Error(`Resend API error: ${result.error.message}`);
            }
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
            throw error;
        }
    }

    async sendWaitlistConfirmation(to: string): Promise<void> {
        console.log(`Sending waitlist confirmation to ${to}`);
        
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: "You're on the waitlist!",
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1>You're on the waitlist!</h1>
                  <p>Thanks for joining our waitlist. We'll notify you as soon as the ebook is available.</p>
                  <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                    Stay tuned — we'll be in touch soon.
                  </p>
                </div>
             `,
            });
            
            console.log(`✅ Waitlist email sent! ID: ${result.data?.id}, Error: ${result.error?.message || 'none'}`);
            
            if (result.error) {
                throw new Error(`Resend API error: ${result.error.message}`);
            }
        } catch (error) {
            console.error(`❌ Failed to send waitlist email to ${to}:`, error);
            throw error;
        }
    }

    async sendDownloadLink(
        to: string,
        bookTitle: string,
        downloadUrl: string
    ): Promise<void> {
        console.log(`Sending download link to ${to} for book ${bookTitle}`);
        
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: `Your download link for "${bookTitle}"`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1>Your Download Link</h1>
                    <p>Here is your download link for <strong>${bookTitle}</strong>:</p>
                    <a 
                      href="${downloadUrl}"
                      style="
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        margin-top: 16px;
                      "
                    >
                      Download Now
                    </a>
                    <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                      This link expires in 24 hours.
                    </p>
                  </div>
                `,
            });
            
            console.log(`✅ Download link email sent! ID: ${result.data?.id}, Error: ${result.error?.message || 'none'}`);
            
            if (result.error) {
                throw new Error(`Resend API error: ${result.error.message}`);
            }
        } catch (error) {
            console.error(`❌ Failed to send download link to ${to}:`, error);
            throw error;
        }
    }

    async sendAdminAlert(subject: string, body: string): Promise<void> {
    // Implement your email provider logic here (e.g., Resend, SendGrid, Nodemailer)
    console.log(`[Email Sent to Admin] Subject: ${subject}`);
  }
}
