import { initializeApp, getApps, cert } from 'firebase-admin/app';

export const initAdmin = () => {
  if (getApps().length === 0) {
    try {
      const decodedKey = Buffer.from(
        process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64 || '', 
        'base64'
      ).toString('utf-8');

      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

      if (!decodedKey || !clientEmail || !projectId) {
        throw new Error('Missing Firebase Admin credentials');
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: decodedKey,
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw error;
    }
  }
};