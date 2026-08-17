import { Controller, Get, Req, UseGuards, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { EmailService } from 'src/email/email.service';

@ApiTags('Purchases')
@Controller('purchases')
export class PurchasesController {
    constructor(
        private purchasesService: PurchasesService,
        private emailService: EmailService,
    ) {}

    @Get()
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Get user purchases' })
    @ApiResponse({ status: 200, description: 'List of user purchases' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getPurchases(@Req() req: any) {
        return this.purchasesService.getPurchasesByUser(req.user.uid);
    }

    @Get(':bookId/download')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Get download URL for purchased book' })
    @ApiResponse({ status: 200, description: 'Signed download URL (valid for 24 hours)' })
    @ApiResponse({ status: 403, description: 'No purchase access to this book' })
    @ApiResponse({ status: 404, description: 'Book or user not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getDownloadUrl(@Req() req: any, @Param('bookId') bookId: string) {
        return this.purchasesService.getDownloadUrl(req.user.uid, bookId);
    }

    @Post(':purchaseId/resend-email')
    @UseGuards(AdminGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Resend purchase confirmation email' })
    @ApiResponse({ status: 200, description: 'Email resent successfully' })
    @ApiResponse({ status: 404, description: 'Purchase not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async resendEmail(@Param('purchaseId') purchaseId: string) {
        return this.purchasesService.resendConfirmationEmail(purchaseId);
    }
}