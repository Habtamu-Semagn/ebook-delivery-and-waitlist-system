import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { FirebaseService } from "src/firebase/firebase.service";

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private firebaseService: FirebaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'] as string | undefined;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ForbiddenException('Missing authorization header');
        }

        const token = authHeader.split(' ')[1]!;
        const decodedToken = await this.firebaseService.verifyToken(token);

        if(!decodedToken.admin) {
            throw new ForbiddenException('Admin access required');
        }

        request['user'] = decodedToken;
        return true;
    }
}