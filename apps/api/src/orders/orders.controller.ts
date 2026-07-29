import { Controller, Param, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
    constructor(private ordersService: OrdersService) {}

    @Post(':bookId')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth('Firebase')
    @ApiParam({ name: 'bookId', description: 'Book ID to purchase' })
    @ApiOperation({ summary: 'Create Stripe checkout session for book purchase' })
    @ApiResponse({ status: 201, description: 'Checkout session created with sessionId' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Book not found' })
    async createOrder(
        @Param('bookId') bookId: string,
        @Req() req: any,
    ) {
        try {
            return await this.ordersService.createOrder(bookId, req.user.uid);
        } catch (error: any) {
            if (error instanceof BadRequestException || error.message?.includes('not found')) {
                throw error;
            }
            throw new BadRequestException(
                `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
