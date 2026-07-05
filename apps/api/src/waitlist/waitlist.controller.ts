import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('waitlist')
export class WaitlistController {
    constructor(private waitlistService: WaitlistService) {}

    @Post()
    async joinWaitlist(@Body() body: { email: string }) {
        return this.waitlistService.joinWaitlist(body.email);
    }

    @Get("count")
    @UseGuards(AdminGuard)
    async getwaitlistCount() {
        return this.waitlistService.getWaitlistCount();
    }
}
