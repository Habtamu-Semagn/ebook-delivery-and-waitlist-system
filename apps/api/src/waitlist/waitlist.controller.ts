import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@Controller('waitlist')
export class WaitlistController {
    constructor(private waitlistService: WaitlistService) {}

    @Post()
    async joinWaitlist(@Body() body: { email: string }) {
        return this.waitlistService.joinWaitlist(body.email);
    }

    @Get("count")
    @UseGuards(FirebaseAuthGuard)
    async getwaitlistCount() {
        return this.waitlistService.getWaitlistCount();
    }
}
