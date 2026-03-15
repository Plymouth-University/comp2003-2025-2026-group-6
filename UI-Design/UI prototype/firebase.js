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