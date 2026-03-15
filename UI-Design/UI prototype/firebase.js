// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAYQeZzdYUqKYiiwcpFp8BNZQsJNHtoMXo",
  authDomain:        "ctf-game-06.firebaseapp.com",
  projectId:         "ctf-game-06",
  storageBucket:     "ctf-game-06.firebasestorage.app",
  messagingSenderId: "509318018925",
  appId:             "1:509318018925:web:a91ddc9f7fc130dfe54c64",
  measurementId:     "G-L4WP0E0V6S"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };

/**
 * Sign in with Google and create/update user doc in Firestore.
 * Returns the Firebase user object.
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result   = await signInWithPopup(auth, provider);
  const user     = result.user;
  await createOrUpdateUser(user);
  return user;
}

/**
 * Listen for auth state changes.
 * Calls callback(user) when logged in, callback(null) when logged out.
 */
export function listenAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign out the current user.
 */
export async function logOut() {
  await signOut(auth);
}

/**
 * Create a new user doc on first sign in.
 * On return visits, just updates lastLoginAt.
 */
export async function createOrUpdateUser(firebaseUser, role = "student") {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snap    = await getDoc(userRef);
 
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid:         firebaseUser.uid,
      username:    firebaseUser.displayName || firebaseUser.email.split("@")[0],
      email:       firebaseUser.email,
      role:        role,
      createdAt:   serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } else {
    await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
  }
}

/**
 * Get a user document by UID.
 */
export async function getUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Update a user's role e.g. promote to teacher.
 */
export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, "users", uid), { role });
}