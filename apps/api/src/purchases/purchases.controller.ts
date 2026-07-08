import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@ApiTags('Purchases')
@Controller('purchases')
export class PurchasesController {
    constructor(private purchasesService: PurchasesService) {}

    @Get()
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Get user purchases' })
    @ApiResponse({ status: 200, description: 'List of user purchases' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getPurchases(@Req() req: any) {
        return this.purchasesService.getPurchasesByUser(req.user.uid);
    }
}