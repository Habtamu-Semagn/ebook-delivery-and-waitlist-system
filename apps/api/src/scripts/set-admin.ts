import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

dotenv.config({ path: `${__dirname}/../../.env` });

initializeApp({
  credential: cert({
    projectId: process.env['FIREBASE_PROJECT_ID']!,
    clientEmail: process.env['FIREBASE_CLIENT_EMAIL']!,
    privateKey: process.env['FIREBASE_PRIVATE_KEY']!.replace(/\\n/g, '\n'),
  }),
});

async function setAdminClaim() {
    const uid = process.argv[2];
    if(!uid) {
        console.error('Please provide a Firebase UID as argument');
        process.exit(1);
    }

    await getAuth().setCustomUserClaims(uid, { admin: true });
    console.log(`Admin claim set for uid: ${uid}`);
    process.exit(0);
}

setAdminClaim();