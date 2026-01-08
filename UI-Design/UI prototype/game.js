const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const pauseBtn = document.getElementById("pauseBtn");

const timeLeftEl = document.getElementById("timeLeft");
const statusEl = document.getElementById("status");

const scoreAEl = document.getElementById("scoreA");
const scoreBEl = document.getElementById("scoreB");
const lbA = document.querySelector('[data-player="Aarju"]');
const lbB = document.querySelector('[data-player="BotB"]');

const staminaEl = document.getElementById("stamina");
const targetScoreEl = document.getElementById("targetScore");

let running = false;
let paused = false;

let timeLeft = 60;
let timerId = null;

const TARGET_SCORE = 5;

const state = {
  scoreA: 0,
  scoreB: 0,

  player: {
    x: 60, y: 60, w: 28, h: 28,
    baseSpeed: 4,
    sprintSpeed: 7,
    stamina: 100,
    hasFlag: false
  },

  // Enemy flag that Team A steals
  flag: { x: 700, y: 260, r: 14, carried: false },

  // Team A base zone (return flag here to score)
  baseA: { x: 20, y: 160, w: 100, h: 110 },

  // Obstacles (walls)
  obstacles: [
    { x: 320, y: 120, w: 80, h: 180 },
    { x: 520, y: 80,  w: 60, h: 120 },
    { x: 560, y: 260, w: 120, h: 60  },
  ],

  keys: {
    ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false,
    Shift:false
  },
};

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

function syncUI(){
  timeLeftEl.textContent = String(timeLeft);
  scoreAEl.textContent = String(state.scoreA);
  scoreBEl.textContent = String(state.scoreB);
  lbA.textContent = String(state.scoreA);
  lbB.textContent = String(state.scoreB);

  if (staminaEl) staminaEl.value = Math.round(state.player.stamina);
  if (targetScoreEl) targetScoreEl.textContent = String(TARGET_SCORE);
}

function setStatus(msg){
  statusEl.textContent = msg;
}

function resetRound(){
  const p = state.player;
  p.x = 60; p.y = 60;
  p.hasFlag = false;
  state.flag.carried = false;
  moveFlag();
  setStatus("New round: capture the flag and return to Team A base!");
}

function resetGame(){
  running = false;
  paused = false;

  clearInterval(timerId);
  timerId = null;

  timeLeft = 60;
  state.scoreA = 0;
  state.scoreB = 0;

  state.player.stamina = 100;

  resetRound();
  syncUI();
  draw();
}

function moveFlag(){
  // keep away from edges and base
  state.flag.x = rand(220, canvas.width - 80);
  state.flag.y = rand(60, canvas.height - 60);
}

function start(){
  if (running) return;
  running = true;
  paused = false;

  setStatus("Game running! Steal the flag → return to base to score.");

  if (!timerId){
    timerId = setInterval(() => {
      if (!running || paused) return;

      timeLeft -= 1;

      // Demo bot scoring (Team B)
      if (timeLeft % 8 === 0) state.scoreB += 1;

      // Win check
      if (state.scoreA >= TARGET_SCORE || state.scoreB >= TARGET_SCORE){
        running = false;
        const winner = state.scoreA >= TARGET_SCORE ? "Team A" : "Team B";
        setStatus(`${winner} wins! Press Reset to play again.`);
      }

      if (timeLeft <= 0){
        timeLeft = 0;
        running = false;
        setStatus(`Time! Final score A:${state.scoreA} B:${state.scoreB}`);
      }

      syncUI();
    }, 1000);
  }

  loop();
}

function togglePause(){
  if (!running) return;
  paused = !paused;
  setStatus(paused ? "Paused." : "Resumed. Capture the flag!");
  if (!paused) loop();
}

function rectRectCollide(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectCircleCollide(rect, circle){
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx*dx + dy*dy) <= (circle.r*circle.r);
}

function clampPlayer(){
  const p = state.player;
  p.x = Math.max(0, Math.min(canvas.width - p.w, p.x));
  p.y = Math.max(0, Math.min(canvas.height - p.h, p.y));
}

function attemptMove(dx, dy){
  const p = state.player;
  const next = { x: p.x + dx, y: p.y + dy, w: p.w, h: p.h };

  // block movement if colliding with obstacles
  for (const ob of state.obstacles){
    if (rectRectCollide(next, ob)) return;
  }

  p.x = next.x;
  p.y = next.y;
}

function update(){
  const p = state.player;

  // Sprint mechanics
  const sprinting = state.keys.Shift && p.stamina > 0;
  const speed = sprinting ? p.sprintSpeed : p.baseSpeed;

  if (sprinting) p.stamina = Math.max(0, p.stamina - 0.9);
  else p.stamina = Math.min(100, p.stamina + 0.5);

  let dx = 0, dy = 0;
  if (state.keys.ArrowUp) dy -= speed;
  if (state.keys.ArrowDown) dy += speed;
  if (state.keys.ArrowLeft) dx -= speed;
  if (state.keys.ArrowRight) dx += speed;

  // move separately (feels nicer with collisions)
  if (dx !== 0) attemptMove(dx, 0);
  if (dy !== 0) attemptMove(0, dy);

  clampPlayer();

  // pick up flag
  if (!p.hasFlag && rectCircleCollide(p, state.flag)){
    p.hasFlag = true;
    state.flag.carried = true;
    setStatus("Flag captured! Return to Team A base to score.");
  }

  // if carrying, flag follows player
  if (p.hasFlag){
    state.flag.x = p.x + p.w + 8;
    state.flag.y = p.y + p.h / 2;
  }

  // score when returning to base with flag
  if (p.hasFlag && rectRectCollide(p, state.baseA)){
    state.scoreA += 1;
    p.hasFlag = false;
    state.flag.carried = false;

    setStatus("Scored for Team A! New round...");
    resetRound();
  }

  // win condition immediately after score
  if (state.scoreA >= TARGET_SCORE || state.scoreB >= TARGET_SCORE){
    running = false;
    const winner = state.scoreA >= TARGET_SCORE ? "Team A" : "Team B";
    setStatus(`${winner} wins! Press Reset to play again.`);
  }

  syncUI();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // simple grid background
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  for (let x=0; x<canvas.width; x+=40){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y=0; y<canvas.height; y+=40){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }
  ctx.restore();

  // base A zone
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#19b83d";
  ctx.fillRect(state.baseA.x, state.baseA.y, state.baseA.w, state.baseA.h);
  ctx.globalAlpha = 1;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000";
  ctx.strokeRect(state.baseA.x, state.baseA.y, state.baseA.w, state.baseA.h);
  ctx.fillStyle = "#000";
  ctx.font = "800 14px system-ui";
  ctx.fillText("TEAM A BASE", state.baseA.x + 6, state.baseA.y - 8);
  ctx.restore();

  // obstacles
  for (const ob of state.obstacles){
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
  }

  // flag
  ctx.beginPath();
  ctx.arc(state.flag.x, state.flag.y, state.flag.r, 0, Math.PI*2);
  ctx.fillStyle = "#ff9900";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // player
  ctx.fillStyle = "#19b83d";
  ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000";
  ctx.strokeRect(state.player.x, state.player.y, state.player.w, state.player.h);

  // carry indicator
  if (state.player.hasFlag){
    ctx.fillStyle = "#000";
    ctx.font = "900 14px system-ui";
    ctx.fillText("CARRYING FLAG", state.player.x - 10, state.player.y - 10);
  }

  // instructions
  ctx.fillStyle = "#000";
  ctx.font = "700 16px system-ui";
  ctx.fillText("Move: Arrow keys | Sprint: Shift | Capture flag → return to base", 12, 22);
}

function loop(){
  if (!running || paused) { draw(); return; }
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift") state.keys.Shift = true;
  if (e.key in state.keys) state.keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") state.keys.Shift = false;
  if (e.key in state.keys) state.keys[e.key] = false;
});

// Buttons
startBtn.addEventListener("click", start);
resetBtn.addEventListener("click", resetGame);
pauseBtn?.addEventListener("click", togglePause);

// Init
resetGame();
