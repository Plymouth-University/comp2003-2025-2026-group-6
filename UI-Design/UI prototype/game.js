import { db, addTeamScore } from './firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Game variables
let quizBonusTime = 0;
let quizScore = 0;
let baseTime = 60;
let multiplier = 1;
let currentQ = 0;
let questions = [];
let questionsThisRound = 0;
let questionTimer;

// Initializes game and fetches questions
async function initGameFlow() {
    const roomId = localStorage.getItem("roomId");
    if (!roomId) return;

    try {
        const response = await getDocs(collection(db, "rooms", roomId, "questions"));
        questions = response.docs.map(doc => doc.data());
        if (questions.length > 0) {
            startQuiz();
        }
    } catch (err) {
        console.error("Error loading questions", err);
    }
}

// Controls the question popup and scoring
function startQuiz() {
    const modal = document.getElementById('questionModal');
    modal.style.display = 'flex';
    
    multiplier = 1;
    quizScore = 0;
    questionsThisRound = 0;

    // Renders a single question
    function renderQuestion() {
        if (currentQ >= questions.length) {
            currentQ = 0;
        }

        if (questionsThisRound >= 3) {
            modal.style.display = 'none';
            return showGameBrief();
        }

        const qData = questions[currentQ];
        document.getElementById('questionText').textContent = qData.question;
        
        const container = document.getElementById('optionsContainer');
        const timerBar = document.getElementById('quizTimerBar');
        container.innerHTML = '';
        
        let timeLeft = 10;
        
        // Resets and animates the timer bar
        if (timerBar) {
            timerBar.style.transition = 'none';
            timerBar.style.width = '100%';
            timerBar.style.backgroundColor = '#00e5ff';
            void timerBar.offsetWidth;
            timerBar.style.transition = 'width 1s linear, background-color 0.5s';
        }

        // Handles the 10 second countdown
        clearInterval(questionTimer);
        questionTimer = setInterval(() => {
            timeLeft--;
            if (timerBar) {
                timerBar.style.width = (timeLeft / 10) * 100 + '%';
                if (timeLeft <= 3) timerBar.style.backgroundColor = '#ff5e5e';
            }
            
            if (timeLeft <= 0) {
                clearInterval(questionTimer);
                handleAnswerLogic(null, null);
            }
        }, 1000);

        // Creates answer buttons
        qData.answers.forEach((opt) => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.className = 'option-btn';
            btn.onclick = () => {
                clearInterval(questionTimer);
                handleAnswerLogic(opt, btn);
            };
            container.appendChild(btn);
        });
    }

    // Checks answer and applies points
    function handleAnswerLogic(selectedOpt, btnClicked) {
        const container = document.getElementById('optionsContainer');
        const allBtns = container.querySelectorAll("button");
        allBtns.forEach(b => b.disabled = true);

        // The Fix: .trim() removes invisible spaces that were breaking the score check
        const isCorrect = String(selectedOpt).trim() === String(questions[currentQ].correctAns).trim();

        if (isCorrect) {
            quizBonusTime += 5;
            multiplier += 0.25;
            quizScore += 100;
            
            if (btnClicked) {
                btnClicked.textContent = "CORRECT! +100 PTS";
                btnClicked.classList.add("disabled-correct");
            }
        } else {
            if (btnClicked) {
                btnClicked.textContent = "INCORRECT";
                btnClicked.classList.add("disabled-incorrect");
            }
        }

        // Displays current points and multiplier
        const statsText = document.createElement('div');
        statsText.textContent = `Points: ${quizScore} | Multiplier: ${multiplier}x`;
        statsText.style.color = "#00e5ff";
        statsText.style.marginTop = "15px";
        statsText.style.fontWeight = "bold";
        container.appendChild(statsText);

        // Moves to next question after delay
        setTimeout(() => {
            currentQ++;
            questionsThisRound++;
            renderQuestion();
        }, 1500);       
    }
    
    renderQuestion();
}

// Shows briefing screen before Unity game
function showGameBrief() {
    const briefModal = document.getElementById('briefModal');
    document.getElementById('briefStatsDisplay').textContent = `Trivia Points: ${quizScore} | Multiplier: ${multiplier}x`;
    briefModal.style.display = 'flex';

    document.getElementById('startMiniGameBtn').onclick = () => {
        briefModal.style.display = 'none';
        launchUnityGame();
    };
}

// Starts the Unity WebGL game
function launchUnityGame() {
    const finalStartTime = baseTime + quizBonusTime;
    document.getElementById("timeLeft").textContent = finalStartTime;
    document.getElementById("status").textContent = `Bonus time: +${quizBonusTime}s`;

    const iframe = document.getElementById("unityIframe");
    iframe.src = iframe.src;

    setTimeout(() => {
        iframe.contentWindow.postMessage({ type: "START_GAME", time: finalStartTime }, "*");
    }, 1000);
}

// Starts the app on load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGameFlow);
} else {
    initGameFlow();
}

// Listens for game over from Unity and saves scores
document.addEventListener('unityGameOver', async function(e) {
    const unityBaseScore = e.detail.score;
    const unityTotal = Math.floor(unityBaseScore * multiplier);
    const finalScore = quizScore + unityTotal; 
    
    const statusEl = document.getElementById('status');
    statusEl.textContent = `ROUND COMPLETE: ${finalScore} PTS!`;
    statusEl.style.color = "#00e5ff";

    const roomId = localStorage.getItem("roomId");
    const team = localStorage.getItem("team") || "A";

    try {
        // Finds the active match
        const q = query(collection(db, "matches"), where("roomId", "==", roomId));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const matchId = snap.docs[0].id;
            await addTeamScore(matchId, team, finalScore);
        }

        // Restarts the quiz loop after 3 seconds
        setTimeout(() => {
            quizBonusTime = 0; 
            quizScore = 0; 
            startQuiz();
        }, 3000); 

    } catch (error) {
        console.error("Firebase update failed:", error);
    }
});