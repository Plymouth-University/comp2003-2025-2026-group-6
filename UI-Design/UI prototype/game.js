import { db } from './firebase.js';
import { doc, setDoc, collection, getDocs, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// --- GAME CONFIG ---
let quizBonusTime = 0;
let baseTime = 60; 

let multiplier;

// --- 1. INITIALIZE GAME FLOW ---
// Restores the full sequence: Load AI Questions -> Run Quiz -> Start Unity
async function initGameFlow() {
    try {
        const roomId = localStorage.getItem("roomId");
        const response = await getDocs(collection(db, "rooms", roomId, "questions"));
        if (response.empty) throw new Error("questions not found");
        
        const questions = response.docs.map(doc => doc.data());

        startQuiz(questions);
    } catch (err) {
        console.warn("Quiz phase skipped due to missing questions.json");
        launchUnityGame();
    }
}

// --- 2. QUIZ PHASE LOGIC ---
function startQuiz(questions) {
    const modal = document.getElementById('questionModal');
    if (!modal) return launchUnityGame();

    modal.style.display = 'flex';
    let currentQ = 0;
    multiplier = 1;

    function renderQuestion() {
        if (currentQ >= questions.length) {
            modal.style.display = 'none';
            launchUnityGame();
            return;
        }

        const qData = questions[currentQ];
        const questionTextEl = document.getElementById('questionText');
        if (questionTextEl) questionTextEl.textContent = qData.question;
        
        const container = document.getElementById('optionsContainer');
        if (container) {
            container.innerHTML = '';
            qData.answers.forEach((opt) => {
                const btn = document.createElement('button');
                btn.textContent = opt;
                btn.className = 'option-btn'; // Restores your CSS styling
                btn.onclick = () => {
                    if (opt === qData.correctAns) {
                        quizBonusTime += 5; // Reward logic restored
                        multiplier += 0.25;
                        btn.textContent = "Correct!";
                        multiplierText.textContent = `Current multiplier: ${multiplier}x`;
                    } else {
                        btn.textContent = "Incorrect...";
                    }
                    setTimeout(() => {
                        currentQ++;
                        renderQuestion();
                    }, 1500);       
                };
                container.appendChild(btn);
            });
            const multiplierText = document.createElement('multiplier');
            multiplierText.textContent = `Current multiplier: ${multiplier}x`;
            multiplierText.className = "info-text";
            container.appendChild(multiplierText);
        }
    }
    renderQuestion();
}

// --- 3. UNITY PREP ---
function launchUnityGame() {
    const finalStartTime = baseTime + quizBonusTime;
    const timerEl = document.getElementById("timeLeft");
    if (timerEl) timerEl.textContent = finalStartTime;

    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.textContent = `Bonus time applied: +${quizBonusTime}s. Ready to start!`;
}

// --- 4. MULTIPLAYER SYNC (FIREBASE) ---
function startApp() {
    const sessionPin = localStorage.getItem("sessionPin") || "DEFAULT_SESSION";
    const sessionRef = doc(db, "sessions", sessionPin);

    // Restores live score updates for both teams
    onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const scoreA = document.getElementById("scoreA");
            const scoreB = document.getElementById("scoreB");
            if (scoreA) scoreA.textContent = data.teamAScore || 0;
            if (scoreB) scoreB.textContent = data.teamBScore || 0;
        }
    });
    console.log("App started");
    initGameFlow();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
} else {
    startApp();
}

// --- 5. UNITY SCORE CATCHER ---
// Restores the logic that takes Unity points and updates the Cloud DB
document.addEventListener('unityGameOver', async function(e) {
    const statusEl = document.getElementById('status');
    const finalScore = e.detail.score * multiplier;
    const team = localStorage.getItem("team") || "A";
    const playerName = localStorage.getItem("playerName") || "Player";
    const sessionPin = localStorage.getItem("sessionPin") || "DEFAULT_SESSION";

    try {
        const sessionRef = doc(db, "sessions", sessionPin);

        // Update Score Text
        statusEl.textContent = "HACK COMPLETE: " + finalScore + " POINTS!" + " (" + e.detail.score + "x" + multiplier + ")";

        // Update Team Total
        const updateObj = {};
        updateObj[team === "A" ? "teamAScore" : "teamBScore"] = increment(finalScore);
        await setDoc(sessionRef, updateObj, { merge: true });

        // Update Individual Player Record
        const playerRef = doc(db, "sessions", sessionPin, "players", playerName);
        await setDoc(playerRef, { 
            score: increment(finalScore), 
            team: team 
        }, { merge: true });
        
        console.log("Scores successfully pushed to Firebase.");
    } catch (error) {
        console.error("Firebase update failed:", error);
    }
});