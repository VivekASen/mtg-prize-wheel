document.addEventListener('DOMContentLoaded', () => {

  // === CONFIG ===
  const spinWebhook = 'YOUR_DISCORD_WEBHOOK_URL_FOR_SPINS';
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

  let angle = 0;
  let spinning = false;
  let spinVelocity = 0;

  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');

  window.startApp = function () {
    playerName = document.getElementById('playerName').value.trim();
    if (!playerName) return;

    document.getElementById('nameEntry').classList.add('hidden');

    if (playerName.toLowerCase() === 'admin') {
      document.getElementById('adminPanel').classList.remove('hidden');
      renderPrizeTables();
      return;
    }

    secretMission = secretMissions[Math.floor(Math.random() * secretMissions.length)];
    document.getElementById('secretMission').innerText = `🎯 Secret Mission: ${secretMission}`;
    document.getElementById('secretMission').classList.remove('hidden');
    document.getElementById('missionTracker').classList.remove('hidden');
  }

  window.completeMission = function () {
    document.getElementById('missionTracker').classList.add('hidden');
    document.getElementById('spinSection').classList.remove('hidden');

    fetch(missionWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `✅ **${playerName}** completed their secret mission: "${secretMission}"` })
    });
    drawWheel();
  }

  function drawWheel() {
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

  window.spinWheel = function () {
    if (spinning || prizes.length === 0) return;
    spinning = true;
    spinVelocity = 0.2 + Math.random() * 0.1;
    animateWheel();
  }

  function revealPrize() {
    const index = Math.floor((prizes.length - (angle / (2 * Math.PI)) * prizes.length) % prizes.length);
    const prize = prizes.splice(index, 1)[0];
    claimed.push({ name: playerName, prize });
    localStorage.setItem('prizes', JSON.stringify(prizes));
    localStorage.setItem('claimed', JSON.stringify(claimed));
    document.getElementById('prizeReveal').innerText = `🎉 You won: ${prize}`;
    document.getElementById('confettiCanvas').classList.remove('hidden');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    fetch(spinWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `🎡 **${playerName}** spun the wheel and won: **${prize}**` })
    });
  }

  window.uploadPrizes = function () {
    const raw = document.getElementById('prizeListInput').value;
    prizes = raw.split('\n').map(x => x.trim()).filter(Boolean);
    claimed = [];
    localStorage.setItem('prizes', JSON.stringify(prizes));
    localStorage.setItem('claimed', JSON.stringify(claimed));
    renderPrizeTables();
  }

  window.resetPrizePool = function () {
    prizes = [];
    claimed = [];
    localStorage.removeItem('prizes');
    localStorage.removeItem('claimed');
    document.getElementById('prizeListInput').value = '';
    renderPrizeTables();
    drawWheel();
  }

  function renderPrizeTables() {
    const remainingDiv = document.getElementById('remainingPrizes');
    const claimedDiv = document.getElementById('claimedPrizes');

    remainingDiv.innerHTML = `<h3>Remaining Prizes (${prizes.length})</h3><ul>${prizes.map(p => `<li>${p}</li>`).join('')}</ul>`;
    claimedDiv.innerHTML = `<h3>Claimed Prizes (${claimed.length})</h3><ul>${claimed.map(c => `<li>${c.name} won ${c.prize}</li>`).join('')}</ul>`;
    drawWheel();
  }

});
