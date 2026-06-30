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
        if(getApps().length === 0) {
            this.app = initializeApp({
                credential: cert({
                    projectId: this.configService.getOrThrow<string>('FIREBASE_PROJECT_ID'),
                    clientEmail: this.configService.getOrThrow<string>('FIREBASE_CLIENT_EMAIL'),
                    privateKey: this.configService
                     .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
                     ?.replace(/\\n/g, '\n'),
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