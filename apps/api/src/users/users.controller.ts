import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Post('sync')
    @UseGuards(FirebaseAuthGuard)
    async syncUser(@Req() req: any) {
        const { uid, email } = req.user;
        return this.usersService.syncUser(uid, email);
    }
}
