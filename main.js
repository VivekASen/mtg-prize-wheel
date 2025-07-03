// === CONFIG ===
const spinWebhook = 'https://discord.com/api/webhooks/1389982891068625048/6fALsoRxeELHOP2vFKRpgaSRPlyNncnIDG5EejlNp6eI177xa8g9UeGLGl_llCLXBoFx
';
const missionWebhook = 'YOUR_DISCORD_WEBHOOK_URL_FOR_MISSIONS';

// === STATE ===
let prizes = JSON.parse(localStorage.getItem('prizes') || '[]');
let claimed = JSON.parse(localStorage.getItem('claimed') || '[]');
let playerName = '';
let secretMission = '';
const secretMissions = [
  "Secretly try to move your playmat away from everyone slowly…",
  "Slowly add random tokens (not yours) to your battlefield…",
  "Quote the flavor text of a card as advice…",
  "Make up a fake rule and convince someone…",
  "Inch your commander toward another player’s field…",
  "Propose a deal every turn, even absurd ones…",
  "Use odd objects as tokens without explaining…",
  "Interrupt the game with fake excuses…",
  "Try to steal drinks without getting caught…",
  "Take stealth photos of Tony…",
  "Start straightening other people’s cards or dice…",
  "Pretend to smell a deck or playmat, then nod."
];

// === INIT ===
function startApp() {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return;

  document.getElementById('nameEntry').classList.add('hidden');

  if (playerName.toLowerCase() === 'admin') {
    document.getElementById('adminPanel').classList.remove('hidden');
    renderPrizeTables();
    return;
  }

  // Assign secret mission
  secretMission = secretMissions[Math.floor(Math.random() * secretMissions.length)];
  document.getElementById('secretMission').innerText = `🎯 Secret Mission: ${secretMission}`;
  document.getElementById('secretMission').classList.remove('hidden');
  document.getElementById('missionTracker').classList.remove('hidden');
}

function completeMission() {
  document.getElementById('missionTracker').classList.add('hidden');
  document.getElementById('spinSection').classList.remove('hidden');

  // Notify Discord
  fetch(missionWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `✅ **${playerName}** completed their secret mission: "${secretMission}"` })
  });
}

function spinWheel() {
  if (prizes.length === 0) {
    document.getElementById('prizeReveal').innerText = '🎁 All prizes claimed!';
    return;
  }

  const prizeIndex = Math.floor(Math.random() * prizes.length);
  const prize = prizes.splice(prizeIndex, 1)[0];
  claimed.push({ name: playerName, prize });
  localStorage.setItem('prizes', JSON.stringify(prizes));
  localStorage.setItem('claimed', JSON.stringify(claimed));

  document.getElementById('prizeReveal').innerText = `🎉 You won: ${prize}`;

  // Notify Discord
  fetch(spinWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `🎡 **${playerName}** spun the wheel and won: **${prize}**` })
  });
}

function uploadPrizes() {
  const raw = document.getElementById('prizeListInput').value;
  prizes = raw.split('\n').map(x => x.trim()).filter(Boolean);
  claimed = [];
  localStorage.setItem('prizes', JSON.stringify(prizes));
  localStorage.setItem('claimed', JSON.stringify(claimed));
  renderPrizeTables();
}

function resetPrizePool() {
  prizes = [];
  claimed = [];
  localStorage.removeItem('prizes');
  localStorage.removeItem('claimed');
  document.getElementById('prizeListInput').value = '';
  renderPrizeTables();
}

function renderPrizeTables() {
  const remainingDiv = document.getElementById('remainingPrizes');
  const claimedDiv = document.getElementById('claimedPrizes');

  remainingDiv.innerHTML = `<h3>Remaining Prizes (${prizes.length})</h3><ul>${prizes.map(p => `<li>${p}</li>`).join('')}</ul>`;
  claimedDiv.innerHTML = `<h3>Claimed Prizes (${claimed.length})</h3><ul>${claimed.map(c => `<li>${c.name} won ${c.prize}</li>`).join('')}</ul>`;
}
