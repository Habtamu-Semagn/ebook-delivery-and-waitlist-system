import { Controller, Post, Req, UseGuards, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersController.name)
    constructor(private usersService: UsersService) {}

    @Post('sync')
    @UseGuards(FirebaseAuthGuard)
    async syncUser(@Req() req: any) {
        this.logger.log(`Syncing user: ${req.user.uid}`);
        const { uid, email } = req.user;
        return this.usersService.syncUser(uid, email);
    }
}
