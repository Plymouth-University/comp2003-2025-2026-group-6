import { db, doc, setDoc, increment } from './firebase.js';

// Wait for the HTML page to load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Database bridge ready. Waiting for Unity hack to finish...");
});

// Listen for the game over event sent by Unity
document.addEventListener('unityGameOver', async function(e) {
    const finalScore = e.detail.score;
    
    // Grab player data from local storage
    const team = localStorage.getItem("team") || "A";
    const playerName = localStorage.getItem("playerName") || "UnknownPlayer";
    const sessionPin = localStorage.getItem("sessionPin") || "DEFAULT_SESSION";

    console.log(`Sending ${finalScore} points to Firebase for Team ${team}...`);

    try {
        // Point to this specific game session in the database
        const sessionRef = doc(db, "sessions", sessionPin);
        
        // Add the points to the correct team using increment (prevents overwriting other players' scores)
        if (team === "A") {
            await setDoc(sessionRef, { teamAScore: increment(finalScore) }, { merge: true });
        } else {
            await setDoc(sessionRef, { teamBScore: increment(finalScore) }, { merge: true });
        }

        // Save the individual player's stats
        const playerRef = doc(db, "sessions", sessionPin, "players", playerName);
        await setDoc(playerRef, { score: increment(finalScore), team: team }, { merge: true });

        console.log("SUCCESS: Score saved to Firebase!");
        
    } catch (error) {
        console.error("ERROR saving to Firebase: ", error);
    }
});