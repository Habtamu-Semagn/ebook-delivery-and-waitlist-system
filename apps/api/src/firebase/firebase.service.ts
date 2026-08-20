import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { App, cert, getApps, initializeApp } from 'firebase-admin'
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';


@Injectable()
export class FirebaseService implements OnModuleInit {
    private app!: App;
    constructor(private configService: ConfigService) {}

    onModuleInit() {
        const existingApps = getApps();
        if(existingApps.length === 0) {
            // Get Firebase configuration from environment variables
            const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
            const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
            const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

            // Validate required Firebase configuration
            if (!projectId || !clientEmail || !privateKey) {
                const missing: string[] = [];
                if (!projectId) missing.push('FIREBASE_PROJECT_ID');
                if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
                if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
                
                throw new Error(
                    `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
                    `Please ensure these are set in your Render environment variables.`
                );
            }

            this.app = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            })
        } else {
            this.app = existingApps[0] as App;
        }
    }

    async verifyToken(token: string): Promise<DecodedIdToken> {
        return await getAuth(this.app).verifyIdToken(token);
    }
}