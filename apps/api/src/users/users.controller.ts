import { Controller, Post, Req, UseGuards, Logger, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(private usersService: UsersService) {}

    @Post('sync')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Sync Firebase user to Supabase' })
    @ApiResponse({ status: 201, description: 'User synced successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async syncUser(@Req() req: any) {
        this.logger.log(`Syncing user: ${req.user.uid}`);
        const { uid, email } = req.user;
        return this.usersService.syncUser(uid, email);
    }

    @Post('set-admin/:uid')
    @UseGuards(AdminGuard)
    @ApiBearerAuth('Firebase')
    @ApiParam({ name: 'uid', description: 'User ID to set as admin' })
    @ApiOperation({ summary: 'Set admin custom claims for user (currently unguarded - SECURITY ISSUE)' })
    @ApiResponse({ status: 200, description: 'Admin claims set successfully' })
    @ApiResponse({ status: 400, description: 'Invalid user ID' })
    async setAdmin(@Param('uid') uid: string) {
        const { getAuth } = await import('firebase-admin/auth');
        await getAuth().setCustomUserClaims(uid, { admin: true });
        return { success: true };
    }

    @Get('admin/all')
    @UseGuards(AdminGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Get all users (admin only)' })
    @ApiResponse({ status: 200, description: 'List of all users' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getAllUsers() {
        return this.usersService.getAllUsers();
    }

    @Get('admin/stats')
    @UseGuards(AdminGuard)
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Get user statistics (admin only)' })
    @ApiResponse({ status: 200, description: 'User statistics' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserStats() {
        return this.usersService.getUserStats();
    }
}
