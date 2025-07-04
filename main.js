import { dbRefs, set, get, update } from './firebaseconfig.js';

const spinWebhook = 'YOUR_DISCORD_WEBHOOK_URL_FOR_SPINS';

let playerName = '';
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

function initCanvas() {
  canvas = document.getElementById('wheelCanvas');
  ctx = canvas.getContext('2d');
  canvas.classList.remove('hidden');
}

async function drawWheel(prizes) {
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

function animateWheel(prizes, onFinish) {
  angle += spinVelocity;
  spinVelocity *= 0.98;
  drawWheel(prizes);

  if (spinVelocity < 0.002) {
    spinning = false;
    onFinish();
    return;
  }

  requestAnimationFrame(() => animateWheel(prizes, onFinish));
}

async function spinAndRevealPrize(missionDiv) {
  const prizeSnap = await get(dbRefs.prizes);
  const claimSnap = await get(dbRefs.claimed);
  let prizes = prizeSnap.exists() ? prizeSnap.val() : [];
  let claimed = claimSnap.exists() ? claimSnap.val() : [];

  if (prizes.length === 0) {
    alert("No prizes available.");
    return;
  }

  const normalizedAngle = (2 * Math.PI - (angle % (2 * Math.PI))) % (2 * Math.PI);
  const segmentAngle = (2 * Math.PI) / prizes.length;
  const index = Math.floor(normalizedAngle / segmentAngle);
  const prize = prizes.splice(index, 1)[0];

  claimed.push({ name: playerName, prize });
  await set(dbRefs.prizes, prizes);
  await set(dbRefs.claimed, claimed);

  missionDiv.classList.add('completed');
  missionDiv.innerHTML += `<div class="prize-label">🎁 You won: ${prize}</div>`;

  fetch(spinWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🎯 **${playerName}** completed a mission and won: **${prize}**`
    })
  });

  document.getElementById('confettiCanvas').classList.remove('hidden');
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

  setTimeout(() => {
    document.getElementById('wheelModal').classList.add('hidden');
    document.getElementById('confettiCanvas').classList.add('hidden');
  }, 4000);
}

window.startApp = async function () {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return;

  document.getElementById('nameEntry').classList.add('hidden');
  document.getElementById('missionTracker').classList.remove('hidden');

  const checkSnap = await get(dbRefs.playerChecks);
  const savedChecks = checkSnap.exists() && checkSnap.val()[playerName] ? checkSnap.val()[playerName] : [];

  const prizeSnap = await get(dbRefs.prizes);
  const prizes = prizeSnap.exists() ? prizeSnap.val() : [];

  const missionGrid = document.getElementById('missionGrid');
  missionGrid.innerHTML = '';

  regularMissions.forEach((mission, i) => {
    const tile = document.createElement('div');
    tile.classList.add('mission-tile');
    tile.textContent = mission;

    if (savedChecks.includes(i)) {
      tile.classList.add('completed');
    } else {
      tile.addEventListener('click', async () => {
        const updated = savedChecks.concat(i);
        const allChecks = checkSnap.exists() ? checkSnap.val() : {};
        allChecks[playerName] = updated;
        await set(dbRefs.playerChecks, allChecks);

        tile.removeEventListener('click', this);
        tile.classList.add('completed');

        // Show the modal and start the animation
        document.getElementById('wheelModal').classList.remove('hidden');
        initCanvas();
        angle = 0;
        spinVelocity = 0.25 + Math.random() * 0.1;
        animateWheel(prizes, () => spinAndRevealPrize(tile));
      });
    }

    missionGrid.appendChild(tile);
  });
};
