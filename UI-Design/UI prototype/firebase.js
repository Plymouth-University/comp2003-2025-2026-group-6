// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, initializeFirestore,
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, getDocs,
  query, where, orderBy, limit,
  increment, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// SECTION 1 – CONFIG & INIT

// Firebase project settings - found in firebase console
const firebaseConfig = {
  apiKey:            "AIzaSyDoyLX699KLeAifDwTHBRNVQ86ENNvat6w",
  authDomain:        "capture-the-flag-group-6.firebaseapp.com",
  projectId:         "capture-the-flag-group-6",
  storageBucket:     "capture-the-flag-group-6.firebasestorage.app",
  messagingSenderId: "320174361313",
  appId:             "1:320174361313:web:792f8cb58ecf1527d445a0",
  measurementId:     "G-ZFEQKG7L0L"
};

// Start up firebase and get auth + database ready to use
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Force long polling to fix Firestore connection issues on localhost
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams:               false
});

export { app, auth, db };


// SECTION 2 – AUTH & USERS

// Opens google popup so the player can sign in
// Also saves their info to the database if its their first time
// We wait for the save to finish before returning so the username is always there
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result   = await signInWithPopup(auth, provider);
  const user     = result.user;

  // Wait for the user to be saved to Firestore before moving on
  // This fixes the bug where new players showed their uid instead of username
  try {
    await createOrUpdateUser(user);
  } catch (err) {
    console.warn("Could not save user to Firestore:", err.message);
  }
 
  return user;
}

// Watches if the player is logged in or not
// Useful for redirecting to sign in page if they arent logged in
export function listenAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// Signs the player out
export async function logOut() {
  await signOut(auth);
}

// Saves a new player to the database when they sign in for the first time
// If they already exist just updates their last login time
export async function createOrUpdateUser(firebaseUser, role = "student") {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    // New player - save all their details
    await setDoc(userRef, {
      uid:         firebaseUser.uid,
      username:    firebaseUser.displayName || firebaseUser.email.split("@")[0],
      email:       firebaseUser.email,
      role:        role,
      createdAt:   serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } else {
    // Already exists - just update last login
    await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
  }
}

// Gets a players info from the database using their uid
export async function getUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Changes a players role e.g. from student to teacher
export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, "users", uid), { role });
}


// SECTION 3 – ROOMS & PIN SYSTEM

// Creates a new game room and generates a random 6 digit PIN
// The teacher uses this to start a session
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

// Looks up a room using the PIN the student typed in join.html
// Returns the room data or null if the PIN doesnt exist
export async function getRoomByPin(pin) {
  const q    = query(collection(db, "rooms"), where("joinCode", "==", pin), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { roomId: d.id, ...d.data() };
}

// Updates the room status e.g. open, in_game or closed
export async function updateRoomStatus(roomId, status) {
  await updateDoc(doc(db, "rooms", roomId), { status });
}

// Adds a player to the room when they join with a PIN
// Also saves their chosen role like scout or warrior
export async function joinRoom(roomId, uid, roomRole = null) {
  await setDoc(doc(db, "rooms", roomId, "memberships", uid), {
    uid:      uid,
    roomRole: roomRole,
    joinedAt: serverTimestamp(),
    leftAt:   null
  });
}

// Marks a player as left when they exit the room
export async function leaveRoom(roomId, uid) {
  await updateDoc(doc(db, "rooms", roomId, "memberships", uid), {
    leftAt: serverTimestamp()
  });
}

// Gets a list of everyone currently in the room
export async function getRoomMembers(roomId) {
  const snap = await getDocs(collection(db, "rooms", roomId, "memberships"));
  return snap.docs.map(d => d.data());
}

// Listens for players joining or leaving the room in real time
// Good for showing a live lobby while waiting for the game to start
export function listenRoomMembers(roomId, callback) {
  return onSnapshot(
    collection(db, "rooms", roomId, "memberships"),
    snap => callback(snap.docs.map(d => d.data()))
  );
}


// SECTION 4 – MATCHES

// Starts a new match for a room
// Automatically creates team A and team B both starting at 0 points
export async function createMatch(roomId) {
  const matchRef = await addDoc(collection(db, "matches"), {
    roomId:      roomId,
    startedAt:   serverTimestamp(),
    endedAt:     null,
    winningTeam: null
  });

   // Create both teams at the same time
  await Promise.all([
    setDoc(doc(db, "matches", matchRef.id, "teams", "A"), { teamName: "A", finalScore: 0 }),
    setDoc(doc(db, "matches", matchRef.id, "teams", "B"), { teamName: "B", finalScore: 0 })
  ]);

  console.log("Match started:", matchRef.id);
  return matchRef.id;
}

// Ends the match and saves which team won
export async function endMatch(matchId, winningTeam) {
  await updateDoc(doc(db, "matches", matchId), {
    endedAt:     serverTimestamp(),
    winningTeam: winningTeam
  });
}

// Puts a player into a team for this match
// Uses merge so it wont overwrite if called twice by accident
export async function assignPlayerToTeam(matchId, uid, team, teamRole) {
  await setDoc(
    doc(db, "matches", matchId, "team_members", uid),
    { uid, team, teamRole, assignedAt: serverTimestamp() },
    { merge: true }
  );
}


// SECTION 5 – TEAMS & SCORES


// Adds points to a teams score after the unity game finishes
// Uses increment so if two players finish at the same time neither score gets lost
export async function addTeamScore(matchId, team, points) {
  await updateDoc(doc(db, "matches", matchId, "teams", team), {
    finalScore: increment(points)
  });
}

// Gets the current score for both teams at once
// Returns something like { A: 500, B: 300 }
export async function getTeamScores(matchId) {
  const [snapA, snapB] = await Promise.all([
    getDoc(doc(db, "matches", matchId, "teams", "A")),
    getDoc(doc(db, "matches", matchId, "teams", "B"))
  ]);
  return {
    A: snapA.exists() ? snapA.data().finalScore : 0,
    B: snapB.exists() ? snapB.data().finalScore : 0
  };
}

// Watches both team scores live so the scoreboard updates automatically
// Call the returned function to stop listening when the game ends
export function listenTeamScores(matchId, callback) {
  let scores = { A: 0, B: 0 };

  const unsubA = onSnapshot(
    doc(db, "matches", matchId, "teams", "A"),
    snap => {
      scores.A = snap.exists() ? snap.data().finalScore : 0;
      callback({ ...scores });
    }
  );
  const unsubB = onSnapshot(
    doc(db, "matches", matchId, "teams", "B"),
    snap => {
      scores.B = snap.exists() ? snap.data().finalScore : 0;
      callback({ ...scores });
    }
  );

  // Stop both listeners with one function call
  return () => { unsubA(); unsubB(); };
}


// SECTION 6 – PLAYER STATS & LEADERBOARD

// Sets up a blank stats record for a new player
// Only runs if they dont already have one
export async function initPlayerStats(uid) {
  const statsRef = doc(db, "player_stats", uid);
  const snap     = await getDoc(statsRef);
  if (!snap.exists()) {
    await setDoc(statsRef, {
      uid:                  uid,
      totalScore:           0,
      totalPlaytimeSeconds: 0,
      totalAttempts:        0,
      correctAttempts:      0,
      accuracyPercent:      0,
      lastPlayedAt:         null
    });
  }
}

// Updates a players stats after a match
// Adds to their existing totals rather than replacing them
export async function updatePlayerStats(uid, {
  score           = 0,
  playtimeSeconds = 0,
  attempts        = 0,
  correctAttempts = 0
}) {
  const statsRef = doc(db, "player_stats", uid);

  await setDoc(statsRef, {
    totalScore:           increment(score),
    totalPlaytimeSeconds: increment(playtimeSeconds),
    totalAttempts:        increment(attempts),
    correctAttempts:      increment(correctAttempts),
    lastPlayedAt:         serverTimestamp()
  }, { merge: true });

  // Work out their accuracy percentage and save it
  const snap = await getDoc(statsRef);
  if (snap.exists()) {
    const { totalAttempts: total, correctAttempts: correct } = snap.data();
    const accuracy = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;
    await updateDoc(statsRef, { accuracyPercent: accuracy });
  }
}

// Gets a single players stats
export async function getPlayerStats(uid) {
  const snap = await getDoc(doc(db, "player_stats", uid));
  return snap.exists() ? snap.data() : null;
}

// Gets the top players sorted by score for the leaderboard
export async function getLeaderboard(topN = 10) {
  const q    = query(collection(db, "player_stats"), orderBy("totalScore", "desc"), limit(topN));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// Watches the leaderboard live so it updates whenever a score changes
export function listenLeaderboard(topN = 10, callback) {
  const q = query(
    collection(db, "player_stats"),
    orderBy("totalScore", "desc"),
    limit(topN)
  );
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
}

// Generates a random 6 digit PIN for room codes
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


// SECTION 7 – QUESTION UPLOAD/RETRIEVAL

// Upload questions
export async function uploadQuestions(data) {
  const roomId = localStorage.getItem("roomId");
  for (const qa of data) {
    await addDoc(collection(db, "rooms", roomId, "questions"), qa);
  }
}
