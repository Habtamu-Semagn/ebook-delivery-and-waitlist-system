import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "src/firebase/firebase.service";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    constructor(private firebaseService: FirebaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'] as string | undefined;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.split(' ')[1]!;

        try {
            const decodedToken = await this.firebaseService.verifyToken(token);
            request['user'] = decodedToken;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token')
        }

    }
}