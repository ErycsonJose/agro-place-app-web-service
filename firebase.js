import admin from 'firebase-admin';
const SERVICE_ACCOUNT_KEY = process.env.SERVICE_ACCOUNT_KEY;
const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;