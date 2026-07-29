import { Controller, Post, Req, UseGuards, Logger, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersController.name)
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
}
