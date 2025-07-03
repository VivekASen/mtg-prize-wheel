document.addEventListener('DOMContentLoaded', () => {

  // === CONFIG ===
  const spinWebhook = 'YOUR_DISCORD_WEBHOOK_URL_FOR_SPINS';
  const missionWebhook = 'YOUR_DISCORD_WEBHOOK_URL_FOR_MISSIONS';

  // === STATE ===
  let prizes = JSON.parse(localStorage.getItem('prizes') || '[]');
  let claimed = JSON.parse(localStorage.getItem('claimed') || '[]');
  let playerName = '';
  let secretMission = '';
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
    "Slowly add random tokens (not yours) to your battlefield. Every token added is a spin before someone catches you.",
    "Quote the flavor text of a card as if it were advice to other players",
    "Make up a fake rule and get someone to believe them",
    "Physically inch your commander closer to another player’s battlefield throughout the game. 1 spin per 2 inches. Max 10.",
    "Propose a table deal every turn, even absurd ones. 1 spin for every 2 deals proposed before someone says “stop.” Max 5 spins (10 deals)",
    "Use a weird object (sock, coin, sticker, gum wrapper) as a proxy token without explaining it. 1 spin per proxy used (max 5)",
    "Commercial break - Interrupt the game by standing up and make a fake excuse, then sit back down. (1 spin per unique excuse) (max 3)",
    "Try to steal as many drinks before getting caught. 1 steal = 1 spin, Max 5",
    "Take as many stalker photos of Tony without getting caught. Number of spins based on how many photos you can get away with. Max 5",
    "The Clean up step - Start wiping or straightening other people’s cards or dice piles during your turn. 1 spin per 2 cards you tidy. Max 5 spins",
    "Quietly lean in and pretend to smell a player’s deck or playmat, then nod thoughtfully. 1 spin per sniff that goes unchallenged"
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

    // Assign unique secret mission
    const assignedMissions = JSON.parse(localStorage.getItem('assignedMissions') || '{}');
    if (!assignedMissions[playerName]) {
      const remaining = secretMissions.filter(m => !Object.values(assignedMissions).includes(m));
      assignedMissions[playerName] = remaining[Math.floor(Math.random() * remaining.length)] || "(No missions left)";
      localStorage.setItem('assignedMissions', JSON.stringify(assignedMissions));
    }
    secretMission = assignedMissions[playerName];

    // Render regular mission checklist
    const missionList = document.getElementById('missionList');
    missionList.innerHTML = '';
    const savedChecks = JSON.parse(localStorage.getItem(`checks_${playerName}`) || '[]');
    regularMissions.forEach((mission, i) => {
      const item = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = savedChecks.includes(i);
      checkbox.addEventListener('change', () => {
        const updated = [...document.querySelectorAll('#missionList input')]
          .map((cb, idx) => cb.checked ? idx : null)
          .filter(x => x !== null);
        localStorage.setItem(`checks_${playerName}`, JSON.stringify(updated));

        // Allow spin on every mission checked
        document.getElementById('spinSection').classList.remove('hidden');
        drawWheel();
      });
      const label = document.createElement('label');
      label.textContent = mission;
      item.appendChild(checkbox);
      item.appendChild(label);
      missionList.appendChild(item);
    });

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
