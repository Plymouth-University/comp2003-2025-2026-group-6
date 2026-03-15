// game.js
import { addTeamScore, updatePlayerStats } from './firebase.js';

// Wait for the page to load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Database bridge ready. Waiting for Unity hack to finish...");
});

// Listen for the game over event sent by Unity
document.addEventListener('unityGameOver', async function(e) {
    const finalScore = e.detail.score;

    // Grab player data from localStorage
    const team    = localStorage.getItem("team")    || "A";
    const uid     = localStorage.getItem("uid")     || null;
    const matchId = localStorage.getItem("matchId") || null;

    console.log(`Sending ${finalScore} points to Firebase for Team ${team}...`);

    // Cant save if there is no matchId or uid
    if (!matchId || !uid) {
        console.warn("No matchId or uid found in localStorage - score not saved.");
        return;
    }

    try {
        // Add the score to the correct team
        await addTeamScore(matchId, team, finalScore);

        // Update this players personal stats
        await updatePlayerStats(uid, {
            score:           finalScore,
            playtimeSeconds: 60
        });

        console.log("SUCCESS: Score saved to Firebase!");

    } catch (error) {
        console.error("ERROR saving to Firebase: ", error);
    }
});