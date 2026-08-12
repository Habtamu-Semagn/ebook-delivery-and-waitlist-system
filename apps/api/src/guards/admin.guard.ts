import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "src/firebase/firebase.service";

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private firebaseService: FirebaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'] as string | undefined;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing authorization header');
        }

        const token = authHeader.split(' ')[1]!;

        let decodedToken;
        try {
            decodedToken = await this.firebaseService.verifyToken(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }

        if(decodedToken.admin !== true) {
            throw new ForbiddenException('Admin access required');
        }

        request['user'] = decodedToken;
        return true;
    }
}