import { dbRefs, set, get, update } from './firebaseconfig.js';

const WEBHOOK_SPIN = "https://discord.com/api/webhooks/1391118135368876212/prrtI5HRyehenr30Hv4ZONxZ7WH41e1meW0Z-_r7xjL0K1IEkt9IX1jluSWH0diQTYPe";   // for spin notification
const WEBHOOK_PRIZE = "https://discord.com/api/webhooks/1389982891068625048/6fALsoRxeELHOP2vFKRpgaSRPlyNncnIDG5EejlNp6eI177xa8g9UeGLGl_llCLXBoFx"; // for prize reveal

const regularMissions = [
  "Command Performance – Cast your commander",
  "First Blood – Deal the first combat damage of the game",
  "Death Touch – Destroy another creature with a spell or ability",
  "Birthday gift – Give another player life, mana, or a card",
  "You Shall Not Pass! – Block a creature with power 6+",
  "Political Puppetmaster – Convince an opponent to target another opponent",
  "Lets make a deal - Make a deal with an opponent",
  "Chaos Mage – Cast a spell with cascade, storm, or any chaos effect",
  "Tribal Pride – Control 3+ creatures of the same creature type",
  "From the Grave – Reanimate a permanent or spell",
  "Overkill – Eliminate a player/Deliver the final blow",
  "Taste the Rainbow – Control a permanent of each color (WUBRG)",
  "Big Brain Play – Counter a spell or bounce something",
  "Flavor Win – Use a card with art or flavor text that fits your deck’s theme",
  "Epic Board – Control 10+ creatures on the board",
  "Ancestral Recall – Draw 3+ cards in a turn",
  "Shahrazad – Pause the game to start a mini-game",
  "Solitaire – Take a long turn, at least 6+ actions",
  "Copycat – Cast a spell or ability that copies another spell",
  "Last man standing – Win your pod",
  "Participation trophy – Lose your pod",
  "Thoracle – Win the game because a card says you win",
  "Bilbo, birthday celebrant – Have over 111 life in a game",
  "Deep Cut – Play a card no one else at the table has seen before",
];

const secretMissions = [
  "Playmat Drift - Secretly move your playmat farther and farther away…until someone notices. Mission is complete if you move 5 inches unnoticed.",
  "Token Economy - Sneak at least 3 tokens onto your battlefield without getting caught",
  "Rules Lawyer (Intern) - Invent a totally fake rule and convince someone it’s legit",
  "Commander Creep - Slowly inch your commander at least 3 inches onto an opponent’s board unnoticed. If you're caught you have to start again.",
  "Deal or No Deal - Propose a table deal every turn for at least 3 turns",
  "This burger is a Myr - Use a weird object (sock, coin, etc.) as a proxy or token",
  "Sip Happens - Steal at least 2 drinks onto your playmat without someone calling you out.",
  "Vivek Cam - Take at least 3 stalker photos of Vivek without getting caught. One has to be while he's drinking something.",
  "The Clean up step - Tidy at least 5 items total (cards, dice, tokens, etc.) from at least 2 different players’ boards during your own turns — without being asked or told to stop.",
  "Stare Tactics – Maintain unbroken, silent eye contact with another player for their entire turn; complete it twice without getting called out",
  "Scent of Victory - Lean in and dramatically sniff someone’s deck or playmat. Then nod like you know something they don’t."
]; 

let playerName = '';
let secretMission = '';
let secretCompleted = false;
let secretPrize = null;

window.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('playerName');
  if (savedName) {
    document.getElementById('playerName').value = savedName;
    document.getElementById('currentUserName').innerText = savedName;
    startApp(); // Auto-start with saved session
  }
});

window.startApp = async function () {
  playerName = document.getElementById('playerName').value.trim();
  document.getElementById('currentUserName').textContent = playerName;
  if (!playerName) return;

  document.getElementById('nameEntry').classList.add('hidden');

  if (playerName.toLowerCase() === 'admin') {
    document.getElementById('adminPanel').classList.remove('hidden');
    renderPrizeTables();
    return;
  }


  const missionSnap = await get(dbRefs.assignedMissions);
  const allAssigned = missionSnap.exists() ? missionSnap.val() : {};
  if (!allAssigned[playerName]) {
    const used = Object.values(allAssigned);
    const available = secretMissions.filter(m => !used.includes(m));
    const selected = available[Math.floor(Math.random() * available.length)] || "No mission left";
    await update(dbRefs.assignedMissions, { [playerName]: selected });
    secretMission = selected;
  } else {
    secretMission = allAssigned[playerName];
  }

  const secretSnap = await get(dbRefs.secretMissionCompletions);
  const secretData = secretSnap.exists() ? secretSnap.val() : {};
  secretCompleted = !!secretData[playerName];
  secretPrize = secretData[playerName]?.prize || null;

  document.getElementById('secretMission').classList.remove('hidden');
  document.getElementById('secretMission').innerText = `🎯 Secret Mission: ${secretMission}`;

  const checkSnap = await get(dbRefs.playerChecks);
  const saved = checkSnap.exists() && checkSnap.val()[playerName] ? checkSnap.val()[playerName] : {};
  const completedIndices = Object.keys(saved).map(Number);

  const missionList = document.getElementById('missionList');
  missionList.innerHTML = '';

  regularMissions.forEach((mission, idx) => {
    const tile = document.createElement('div');
    tile.className = 'mission-tile';
    tile.textContent = mission;

    if (completedIndices.includes(idx)) {
      tile.classList.add('completed');
      tile.textContent += ` – 🎁 ${saved[idx]}`;
    }

    tile.addEventListener('click', async () => {
      if (tile.classList.contains('completed')) return;

      const prizeSnap = await get(dbRefs.prizes);
      if (!prizeSnap.exists()) return;

      const prizes = prizeSnap.val();
      const prizeIndex = Math.floor(Math.random() * prizes.length);
      const prize = prizes.splice(prizeIndex, 1)[0];

      const claimedSnap = await get(dbRefs.claimed);
      const claimed = claimedSnap.exists() ? claimedSnap.val() : [];
      claimed.push({ name: playerName, prize });

      saved[idx] = prize;
      await update(dbRefs.playerChecks, { [playerName]: saved });
      await set(dbRefs.prizes, prizes);
      await set(dbRefs.claimed, claimed);

      tile.classList.add('completed');
      tile.textContent += ` – 🎁 ${prize}`;
      triggerTreasureChestAnimation(prize);

      await sendToSpinWebhook(`🎯 ${playerName} completed a mission: "${mission}"`);
      await sendToPrizeWebhook(`🎁 ${playerName} won a prize: **${prize}**`);
    });

    missionList.appendChild(tile);
  });

  document.getElementById('missionTracker').classList.remove('hidden');

  if (secretCompleted) {
    const btn = document.getElementById('secretCompleteBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = `✅ Secret Mission Done! Prize: ${secretPrize}`;
    }

    await sendToSpinWebhook(`🕵️‍♂️ ${playerName} completed their secret mission!`);
    await sendToPrizeWebhook(`🎁 ${playerName} earned a secret prize: **${prize}** 🎉`);
  }
  
  localStorage.setItem('playerName', playerName);
  document.getElementById('userPanel').classList.remove('hidden');

};

function triggerTreasureChestAnimation(prizes) {
  const modal = document.getElementById('giftModal');
  const prizeText = document.getElementById('giftPrizeText');
  const chest = document.getElementById('chestAnimation');

  prizeText.innerText = ''; // Clear previous content
  chest.seek(0);
  chest.play();

  modal.classList.remove('hidden');
  modal.classList.add('open');

  // Format the prize text
  const prizeLines = Array.isArray(prizes)
    ? prizes.map(p => `🎁 ${p}`).join('\n')
    : `🎁 ${prizes}`;

  setTimeout(() => {
    prizeText.innerText = prizeLines;
  }, 2000);

  setTimeout(() => {
    modal.classList.remove('open');
    setTimeout(() => modal.classList.add('hidden'), 800);
  }, 5000);
}

async function sendToSpinWebhook(message) {
  try {
    await fetch(WEBHOOK_SPIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch (error) {
    console.error("Failed to send spin webhook:", error);
  }
}

async function sendToPrizeWebhook(message) {
  try {
    await fetch(WEBHOOK_PRIZE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch (error) {
    console.error("Failed to send prize webhook:", error);
  }
}

window.completeMission = async function () {
  if (secretCompleted) return;

  const prizeSnap = await get(dbRefs.prizes);
  if (!prizeSnap.exists()) return;

  let prizes = prizeSnap.val();
  if (prizes.length < 3) {
    alert("Not enough prizes left to claim 3 rewards!");
    return;
  }

  // Draw 3 prizes
  const selectedPrizes = [];
  for (let i = 0; i < 3; i++) {
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes.splice(prizeIndex, 1)[0];
    selectedPrizes.push(prize);
  }

  // Record as claimed
  const claimedSnap = await get(dbRefs.claimed);
  const claimed = claimedSnap.exists() ? claimedSnap.val() : [];

  selectedPrizes.forEach(p => {
    claimed.push({ name: playerName, prize: p });
  });

  await set(dbRefs.prizes, prizes);
  await set(dbRefs.claimed, claimed);
  await update(dbRefs.secretMissionCompletions, {
    [playerName]: { prize: selectedPrizes }
  });

  // Update button
  const btn = document.getElementById('secretCompleteBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = `✅ Secret Mission Done! Prizes: ${selectedPrizes.join(', ')}`;
  }

  // Fire webhook
  await sendToSpinWebhook(`🕵️‍♂️ ${playerName} completed their secret mission!`);
  await sendToPrizeWebhook(`🎁 ${playerName} earned **3 prizes** for their secret mission:\n• ${selectedPrizes.join('\n• ')}`);

  // Show animation for first prize only
  triggerTreasureChestAnimation(selectedPrizes);

  secretCompleted = true;
  secretPrize = selectedPrizes;
};


window.uploadPrizes = async function () {
  const raw = document.getElementById('prizeListInput').value;
  const newPrizes = raw.split('\n').map(x => x.trim()).filter(Boolean);
  await set(dbRefs.prizes, newPrizes);
  await set(dbRefs.claimed, []);
  renderPrizeTables();
};

window.resetPrizePool = async function () {
  await set(dbRefs.prizes, []);
  await set(dbRefs.claimed, []);
  document.getElementById('prizeListInput').value = '';
  renderPrizeTables();
};

window.resetAllPlayerData = async function () {
  const confirmed = confirm("Are you sure you want to reset all player data and missions? This cannot be undone.");
  if (!confirmed) return;

  await set(dbRefs.playerChecks, {});
  await set(dbRefs.assignedMissions, {});
  await set(dbRefs.secretMissionCompletions, {});
  await set(dbRefs.claimed, []);
  alert("All player data, secret missions, and claimed prizes have been reset.");
  renderPrizeTables();
};


async function renderPrizeTables() {
  const prizesSnap = await get(dbRefs.prizes);
  const claimedSnap = await get(dbRefs.claimed);
  const prizes = prizesSnap.exists() ? prizesSnap.val() : [];
  const claimed = claimedSnap.exists() ? claimedSnap.val() : [];

  document.getElementById('remainingPrizes').innerHTML = `<h3>Remaining Prizes (${prizes.length})</h3><ul>${prizes.map(p => `<li>${p}</li>`).join('')}</ul>`;
  document.getElementById('claimedPrizes').innerHTML = `<h3>Claimed Prizes (${claimed.length})</h3><ul>${claimed.map(c => `<li>${c.name} won ${c.prize}</li>`).join('')}</ul>`;
}

function logout() {
  localStorage.removeItem('playerName');
  location.reload(); // Reload to show login again
}
window.logout = logout;
