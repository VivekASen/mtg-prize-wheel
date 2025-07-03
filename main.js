import { dbRefs, set, get, update, onValue, child } from './firebaseConfig.js';

const spinWebhook = 'YOUR_DISCORD_WEBHOOK_URL_FOR_SPINS';
const missionWebhook = 'YOUR_DISCORD_WEBHOOK_URL_FOR_MISSIONS';

let playerName = '';
let secretMission = '';
let canvas, ctx;
let angle = 0;
let spinning = false;
let spinVelocity = 0;

const regularMissions = [
  "Command Performance – Cast your commander",
  "First Blood – Deal the first combat damage of the game",
  "Death Touch – Destroy another creature with a spell or ability",
  "Birthday gift – Give another player life, mana, or a card",
  "You Shall Not Pass! – Block a creature with power 6+ and your creature survives",
  "Political Puppetmaster – Convince two opponents to target each other",
  "Chaos Mage – Cast a spell with cascade, storm, or chaos effects",
  "Tribal Pride – Control 3+ creatures of the same creature type",
  "From the Grave – Reanimate a creature",
  "Overkill – Eliminate a player in a single turn",
  "Taste the Rainbow – Control a permanent of each color (WUBRG)",
  "Big Brain Play – Counter a spell or bounce something in one turn",
  "Thematic Win – Cast a card that matches your deck’s theme",
  "Epic Board – control 10+ creatures on the board",
  "Surprise Comeback – Go from lowest life to winning your pod",
  "Ancestral Recall – Draw 3+ cards in a turn",
  "Shahrazad – Pause the game to start a mini-game",
  "Solitaire – Take an absurdly long turn, at least 10+ actions",
  "Copycat – Cast a spell or ability that copies another spell",
  "Winner winner chicken dinner – Win your pod",
  "Participation trophy – Spin the wheel after being eliminated",
  "Thoracle – Win the game because a card says you win",
  "Bilbo, birthday celebrant – Have over 111 life in a game",
  "Deep Cut – Play a card no one else at the table has seen before",
  "Meet My Gaze – Pass priority by saying nothing and staring intensely at someone"
];

const secretMissions = [
  "Secretly try to move your playmat away from everyone slowly till someone realizes. Based on how far you are from your original location, the number of inches you’ve moved is how many spins you get",
  "Slowly add random tokens (not yours) to your battlefield...",
  "Quote the flavor text of a card as if it were advice...",
  "Make up a fake rule and get someone to believe it...",
  "Physically inch your commander closer to another player...",
  "Propose a table deal every turn, even absurd ones...",
  "Use a weird object (sock, coin, etc.) as a proxy...",
  "Commercial break - Interrupt the game with an excuse...",
  "Try to steal drinks before getting caught...",
  "Take stalker photos of Tony without getting caught...",
  "The Clean up step - Tidy other people’s cards...",
  "Sniff a playmat or deck and nod thoughtfully..."
];

function initCanvas() {
  canvas = document.getElementById('wheelCanvas');
  ctx = canvas.getContext('2d');
  canvas.classList.remove('hidden');
}

window.startApp = async function () {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return;

  document.getElementById('nameEntry').classList.add('hidden');

  if (playerName.toLowerCase() === 'admin') {
    document.getElementById('adminPanel').classList.remove('hidden');
    renderPrizeTables();
    return;
  }

  const snapshot = await get(dbRefs.assignedMissions);
  const allAssignments = snapshot.exists() ? snapshot.val() : {};
  if (!allAssignments[playerName]) {
    const usedMissions = Object.values(allAssignments);
    const available = secretMissions.filter(m => !usedMissions.includes(m));
    const assigned = available[Math.floor(Math.random() * available.length)] || "(No missions left)";
    await update(dbRefs.assignedMissions, { [playerName]: assigned });
    secretMission = assigned;
  } else {
    secretMission = allAssignments[playerName];
  }

  const missionList = document.getElementById('missionList');
  missionList.innerHTML = '';
  regularMissions.forEach((mission, i) => {
    const item = document.createElement('div');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const label = document.createElement('label');
    label.textContent = mission;
    item.appendChild(checkbox);
    item.appendChild(label);
    missionList.appendChild(item);
  });

  document.getElementById('secretMission').innerText = `🎯 Secret Mission: ${secretMission}`;
  document.getElementById('secretMission').classList.remove('hidden');
  document.getElementById('missionTracker').classList.remove('hidden');
};

window.completeMission = async function () {
  document.getElementById('missionTracker').classList.add('hidden');
  document.getElementById('spinSection').classList.remove('hidden');

  await fetch(missionWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `✅ **${playerName}** completed their secret mission: "${secretMission}"` })
  });

  initCanvas();
  drawWheel();
};

async function drawWheel() {
  const snapshot = await get(dbRefs.prizes);
  if (!snapshot.exists()) return;
  const prizes = snapshot.val();

  if (!canvas || !ctx || prizes.length === 0) return;
  const radius = canvas.width / 2;
  const segmentAngle = (2 * Math.PI) / prizes.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(angle);

  prizes.forEach((prize, i) => {
    const start = i * segmentAngle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, start + segmentAngle);
    ctx.fillStyle = i % 2 === 0 ? '#f2c94c' : '#f2994a';
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + segmentAngle / 2);
    ctx.translate(radius * 0.6, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.fillText(prize.substring(0, 12), -30, 0);
    ctx.restore();
  });

  ctx.restore();
}

function animateWheel() {
  if (!spinning) return;
  angle += spinVelocity;
  spinVelocity *= 0.98;
  if (spinVelocity < 0.002) {
    spinning = false;
    revealPrize();
    return;
  }
  drawWheel();
  requestAnimationFrame(animateWheel);
}

window.spinWheel = async function () {
  if (spinning) return;
  const snapshot = await get(dbRefs.prizes);
  if (!snapshot.exists()) return;

  spinning = true;
  spinVelocity = 0.2 + Math.random() * 0.1;
  initCanvas();
  animateWheel();
};

async function revealPrize() {
  const prizesSnapshot = await get(dbRefs.prizes);
  const claimedSnapshot = await get(dbRefs.claimed);

  let prizes = prizesSnapshot.exists() ? prizesSnapshot.val() : [];
  let claimed = claimedSnapshot.exists() ? claimedSnapshot.val() : [];

  const normalizedAngle = (2 * Math.PI - (angle % (2 * Math.PI))) % (2 * Math.PI);
  const segmentAngle = (2 * Math.PI) / prizes.length;
  const index = Math.floor(normalizedAngle / segmentAngle);
  const prize = prizes.splice(index, 1)[0];

  claimed.push({ name: playerName, prize });

  await set(dbRefs.prizes, prizes);
  await set(dbRefs.claimed, claimed);

  document.getElementById('prizeReveal').innerText = `🎉 You won: ${prize}`;
  document.getElementById('confettiCanvas').classList.remove('hidden');
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

  fetch(spinWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `🎡 **${playerName}** spun the wheel and won: **${prize}**` })
  });
}

window.uploadPrizes = async function () {
  const raw = document.getElementById('prizeListInput').value;
  const newPrizes = raw.split('\n').map(x => x.trim()).filter(Boolean);
  await set(dbRefs.prizes, newPrizes);
  await set(dbRefs.claimed, []);
  renderPrizeTables();
  drawWheel();
};

window.resetPrizePool = async function () {
  await set(dbRefs.prizes, []);
  await set(dbRefs.claimed, []);
  document.getElementById('prizeListInput').value = '';
  renderPrizeTables();
  drawWheel();
};

async function renderPrizeTables() {
  const prizesSnapshot = await get(dbRefs.prizes);
  const claimedSnapshot = await get(dbRefs.claimed);

  const prizes = prizesSnapshot.exists() ? prizesSnapshot.val() : [];
  const claimed = claimedSnapshot.exists() ? claimedSnapshot.val() : [];

  const remainingDiv = document.getElementById('remainingPrizes');
  const claimedDiv = document.getElementById('claimedPrizes');

  remainingDiv.innerHTML = `<h3>Remaining Prizes (${prizes.length})</h3><ul>${prizes.map(p => `<li>${p}</li>`).join('')}</ul>`;
  claimedDiv.innerHTML = `<h3>Claimed Prizes (${claimed.length})</h3><ul>${claimed.map(c => `<li>${c.name} won ${c.prize}</li>`).join('')}</ul>`;
}
