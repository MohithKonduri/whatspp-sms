import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyByg5rUllXOg6c3BG5Evkh9Ux7cNOhvqX0",
  authDomain: "pranadhara-21f68.firebaseapp.com",
  projectId: "pranadhara-21f68",
  storageBucket: "pranadhara-21f68.firebasestorage.app",
  messagingSenderId: "11392333194",
  appId: "1:11392333194:web:2d5e8064ab07ee7a210473",
  measurementId: "G-M95FKMKW9J"
}

let firebaseApp: any = null
let firebaseAuth: any = null
let firebaseDb: any = null

function initializeFirebase() {
  if (firebaseApp) return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb }

  // Check if Firebase app already exists
  const existingApps = getApps()
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]
  } else {
    firebaseApp = initializeApp(firebaseConfig)
  }

  firebaseAuth = getAuth(firebaseApp)
  firebaseDb = getFirestore(firebaseApp)

  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb }
}

// Initialize lazily - only when first accessed
let _auth: any = null
let _db: any = null

function getAuthInstance() {
  if (!_auth) {
    const { auth } = initializeFirebase()
    _auth = auth
  }
  return _auth
}

function getDbInstance() {
  if (!_db) {
    const { db } = initializeFirebase()
    _db = db
  }
  return _db
}

// Export with lazy initialization
export const auth = getAuthInstance()
export const db = getDbInstance()
