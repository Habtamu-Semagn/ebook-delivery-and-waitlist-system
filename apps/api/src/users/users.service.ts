import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
const webSocket = require('ws');

@Injectable()
export class UsersService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        this.supabase = createClient(
            this.configService.getOrThrow<string>('SUPABASE_URL'),
            this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
            {
                realtime: {
                    transport: webSocket,
                },
            }
        );
    }

    async syncUser(firebaseUid: string, email: string) {
        const {data: existingUser } = await this.supabase.from('users').select('id').eq('firebase_uid', firebaseUid).maybeSingle();
        console.log("existing user: ", existingUser)
        if(existingUser){
            return existingUser;
        }
        console.log("firebase uid:", firebaseUid)
        console.log("email: ", email)
        const {data: newUser, error} = await this.supabase.from('users').insert({firebase_uid: firebaseUid, email}).select('id').maybeSingle();
        console.log("new user:", newUser)
        if(error) {
            throw new Error(`Failed to sync user: ${error.message}`);
        }

        return newUser;
    }

    async getAllUsers() {
        const { data, error } = await this.supabase
            .from('users')
            .select('id, email, firebase_uid, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
        }

        return data || [];
    }

    async getUserStats() {
        const { data, error } = await this.supabase
            .from('users')
            .select('id', { count: 'exact' });

        if (error) {
            throw new Error(`Failed to fetch user count: ${error.message}`);
        }

        return {
            totalUsers: data?.length || 0,
        };
    }
}
