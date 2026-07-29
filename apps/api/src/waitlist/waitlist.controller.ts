import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';

@ApiTags('Waitlist')
@Controller('waitlist')
export class WaitlistController {
    constructor(private waitlistService: WaitlistService) {}

    @Post()
    @ApiOperation({ summary: 'Join waitlist with email' })
    @ApiResponse({ status: 201, description: 'Successfully joined waitlist' })
    @ApiResponse({ status: 400, description: 'Email already on waitlist' })
    async joinWaitlist(@Body() body: { email: string }) {
        return this.waitlistService.joinWaitlist(body.email);
    }

    @Get("count")
    @UseGuards(AdminGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Get total waitlist count (admin only)' })
    @ApiResponse({ status: 200, description: 'Waitlist count' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
    async getwaitlistCount() {
        return this.waitlistService.getWaitlistCount();
    }
}
