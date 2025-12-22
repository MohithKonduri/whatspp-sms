// Admin Setup Script for NSS BloodConnect
// Run this after setting up Firebase to create admin users

const {
    initializeApp
} = require('firebase/app');
const {
    getAuth,
    createUserWithEmailAndPassword
} = require('firebase/auth');
const {
    getFirestore,
    doc,
    setDoc
} = require('firebase/firestore');

// You'll need to replace these with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyByg5rUllXOg6c3BG5Evkh9Ux7cNOhvqX0",
    authDomain: "pranadhara-21f68.firebaseapp.com",
    projectId: "pranadhara-21f68",
    storageBucket: "pranadhara-21f68.firebasestorage.app",
    messagingSenderId: "11392333194",
    appId: "1:11392333194:web:2d5e8064ab07ee7a210473",
    measurementId: "G-M95FKMKW9J"
};

async function setupAdmin() {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Admin credentials - CHANGE THESE!
        const adminEmail = 'admin@nss-bloodconnect.com';
        const adminPassword = 'AdminPassword123!';

        console.log('🔐 Creating admin user...');

        // Create admin user
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const adminUser = userCredential.user;

        // Add admin role to Firestore
        await setDoc(doc(db, 'admins', adminUser.uid), {
            email: adminEmail,
            role: 'admin',
            name: 'NSS Admin',
            createdAt: new Date(),
        });

        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('⚠️  Please change the password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    }
}

// Only run if called directly
if (require.main === module) {
    setupAdmin();
}

module.exports = {
    setupAdmin
};