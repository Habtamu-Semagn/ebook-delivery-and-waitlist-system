import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { FirebaseService } from "src/firebase/firebase.service";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    private readonly logger = new Logger(FirebaseAuthGuard.name)
    constructor(private firebaseService: FirebaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'] as string | undefined;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            this.logger.error("Missing or invalid authorization header")
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.split(' ')[1]!;

        try {
            const decodedToken = await this.firebaseService.verifyToken(token);
            this.logger.log(`Token verified for uid: ${decodedToken.uid}`)
            request['user'] = decodedToken;
            return true;
        } catch (err) {
            this.logger.error(`Token verfication failed: ${err}`)
            throw new UnauthorizedException('Invalid or expired token')
        }

    }
}