const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const timeLeftEl = document.getElementById("timeLeft");
const statusEl = document.getElementById("status");

const scoreAEl = document.getElementById("scoreA");
const scoreBEl = document.getElementById("scoreB");
const lbA = document.querySelector('[data-player="Aarju"]');
const lbB = document.querySelector('[data-player="BotB"]');

let running = false;
let timeLeft = 60;
let timerId = null;

const state = {
  scoreA: 0,
  scoreB: 0,
  // player (Team A) controlled by arrow keys
  player: { x: 60, y: 60, w: 28, h: 28, speed: 4 },
  // flag you must touch
  flag: { x: 700, y: 260, r: 14 },
  keys: { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false },
};

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

function resetGame(){
  running = false;
  clearInterval(timerId);
  timerId = null;
  timeLeft = 60;

  state.scoreA = 0;
  state.scoreB = 0;
  state.player.x = 60;
  state.player.y = 60;
  moveFlag();

  syncUI();
  statusEl.textContent = "Press Start to begin.";
  draw();
}

function syncUI(){
  timeLeftEl.textContent = String(timeLeft);
  scoreAEl.textContent = String(state.scoreA);
  scoreBEl.textContent = String(state.scoreB);
  lbA.textContent = String(state.scoreA);
  lbB.textContent = String(state.scoreB);
}

function moveFlag(){
  // keep it away from edges
  state.flag.x = rand(80, canvas.width - 80);
  state.flag.y = rand(80, canvas.height - 80);
}

function start(){
  if (running) return;
  running = true;
  statusEl.textContent = "Game running: capture the flag!";
  if (!timerId){
    timerId = setInterval(() => {
      if (!running) return;
      timeLeft -= 1;

      // simple "bot" scoring to make Team B feel alive (demo feature)
      if (timeLeft % 7 === 0) state.scoreB += 1;

      if (timeLeft <= 0){
        timeLeft = 0;
        running = false;
        statusEl.textContent = `Time! Final score A:${state.scoreA} B:${state.scoreB}`;
      }
      syncUI();
    }, 1000);
  }
  loop();
}

function rectCircleCollide(rect, circle){
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx*dx + dy*dy) <= (circle.r*circle.r);
}

function update(){
  const p = state.player;

  if (state.keys.ArrowUp) p.y -= p.speed;
  if (state.keys.ArrowDown) p.y += p.speed;
  if (state.keys.ArrowLeft) p.x -= p.speed;
  if (state.keys.ArrowRight) p.x += p.speed;

  // clamp to canvas
  p.x = Math.max(0, Math.min(canvas.width - p.w, p.x));
  p.y = Math.max(0, Math.min(canvas.height - p.h, p.y));

  // capture flag
  if (rectCircleCollide(p, state.flag)){
    state.scoreA += 1;
    moveFlag();
    syncUI();
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // simple grid background inside canvas
  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let x=0; x<canvas.width; x+=40){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y=0; y<canvas.height; y+=40){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }
  ctx.restore();

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

  // instructions
  ctx.fillStyle = "#000";
  ctx.font = "700 16px system-ui";
  ctx.fillText("Move: Arrow keys | Touch orange circle to capture", 12, 22);
}

function loop(){
  if (!running) { draw(); return; }
  update();
  draw();
  requestAnimationFrame(loop);
}

// input
window.addEventListener("keydown", (e) => {
  if (e.key in state.keys) state.keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  if (e.key in state.keys) state.keys[e.key] = false;
});

// buttons
startBtn.addEventListener("click", start);
resetBtn.addEventListener("click", resetGame);

// init
resetGame();
