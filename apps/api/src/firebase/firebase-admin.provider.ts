// apps/api/src/firebase/firebase-admin.provider.ts
import { initializeApp, cert, getApps, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let app: App | undefined

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export function getFirebaseAdmin(): App {
  if (app) {
    return app
  }

  const existingApps = getApps()

  if (existingApps.length > 0) {
    app = existingApps[0]!
  } else {
    app = initializeApp({
      credential: cert({
        projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
        clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
        privateKey: getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
    })
  }

  return app
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseAdmin())
}