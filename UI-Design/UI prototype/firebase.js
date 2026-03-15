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

/**
 * Create a new room with an auto-generated 6-digit PIN.
 * Called by a teacher when starting a session.
 * Returns { roomId, joinCode }
 */
export async function createRoom(hostUid, settings = {}) {
  const joinCode = generatePin();
  const roomRef  = await addDoc(collection(db, "rooms"), {
    hostUid:      hostUid,
    joinCode:     joinCode,
    status:       "open",
    createdAt:    serverTimestamp(),
    settingsJson: settings
  });
  console.log(`Room created: ${roomRef.id} | PIN: ${joinCode}`);
  return { roomId: roomRef.id, joinCode };
}

/**
 * Find a room by its 6-digit PIN.
 * Used in join.html when a student enters their PIN.
 * Returns room data including roomId, or null if not found.
 */
export async function getRoomByPin(pin) {
  const q    = query(collection(db, "rooms"), where("joinCode", "==", pin), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { roomId: d.id, ...d.data() };
}

/**
 * Update room status: "open" | "in_game" | "closed"
 */
export async function updateRoomStatus(roomId, status) {
  await updateDoc(doc(db, "rooms", roomId), { status });
}
 
/**
 * Add a player to a room when they join via PIN.
 */
export async function joinRoom(roomId, uid, roomRole = null) {
  await setDoc(doc(db, "rooms", roomId, "memberships", uid), {
    uid:      uid,
    roomRole: roomRole,
    joinedAt: serverTimestamp(),
    leftAt:   null
  });
}

/**
 * Mark a player as having left a room.
 */
export async function leaveRoom(roomId, uid) {
  await updateDoc(doc(db, "rooms", roomId, "memberships", uid), {
    leftAt: serverTimestamp()
  });
}

/**
 * Get all current members of a room (one-time fetch).
 */
export async function getRoomMembers(roomId) {
  const snap = await getDocs(collection(db, "rooms", roomId, "memberships"));
  return snap.docs.map(d => d.data());
}

/**
 * Listen in real-time to players joining the lobby.
 * Calls callback(members[]) every time someone joins or leaves.
 * Returns unsubscribe function.
 */
export function listenRoomMembers(roomId, callback) {
  return onSnapshot(
    collection(db, "rooms", roomId, "memberships"),
    snap => callback(snap.docs.map(d => d.data()))
  );
}

// ─── Helper ───────────────────────────────────────────────────
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}