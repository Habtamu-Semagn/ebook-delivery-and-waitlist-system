import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { equal } from 'assert';

@Controller('orders')
export class OrdersController {
    constructor(private ordersService: OrdersService) {}

    @Post(':bookId')
    @UseGuards(FirebaseAuthGuard)
    async createOrder(
        @Param('bookId') bookId: string,
        @Req() req: any,
    ) {
        return this.ordersService.createOrder(bookId, req.user.uid);
    }
}
