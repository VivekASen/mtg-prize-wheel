import { dbRefs, set, get, update } from './firebaseconfig.js';

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
  "Epic Board – Control 10+ creatures on the board",
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
  "Secretly try to move your playmat away from everyone slowly till someone realizes...",
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

let playerName = '';
let secretMission = '';
let secretCompleted = false;
let secretPrize = null;

window.startApp = async function () {
  playerName = document.getElementById('playerName').value.trim();
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
  }
};

function triggerTreasureChestAnimation(prize) {
  const modal = document.getElementById('giftModal');
  const prizeText = document.getElementById('giftPrizeText');
  const lottieContainer = document.getElementById('lottieContainer');

  if (!modal || !prizeText || !lottieContainer) return;

  modal.classList.remove('hidden');
  prizeText.innerText = ''; // Clear text until animation is done

  const anim = lottie.loadAnimation({
    container: lottieContainer,
    renderer: 'svg',
    loop: false,
    autoplay: true,
    path: 'Animation - 1751606551314.json', // Ensure this is in the same directory or update the path
  });

  anim.addEventListener('complete', () => {
    prizeText.innerText = `🎁 You won: ${prize}`;
    setTimeout(() => {
      modal.classList.add('hidden');
      lottieContainer.innerHTML = ''; // Clean up the animation
    }, 3000);
  });
}

window.completeMission = async function () {
  if (secretCompleted) return;

  const prizeSnap = await get(dbRefs.prizes);
  if (!prizeSnap.exists()) return;

  const prizes = prizeSnap.val();
  const prizeIndex = Math.floor(Math.random() * prizes.length);
  const prize = prizes.splice(prizeIndex, 1)[0];

  const claimedSnap = await get(dbRefs.claimed);
  const claimed = claimedSnap.exists() ? claimedSnap.val() : [];
  claimed.push({ name: playerName, prize });

  await set(dbRefs.prizes, prizes);
  await set(dbRefs.claimed, claimed);
  await update(dbRefs.secretMissionCompletions, { [playerName]: { prize } });

  const btn = document.getElementById('secretCompleteBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = `✅ Secret Mission Done! Prize: ${prize}`;
  }

  triggerTreasureChestAnimation(prize);
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

async function renderPrizeTables() {
  const prizesSnap = await get(dbRefs.prizes);
  const claimedSnap = await get(dbRefs.claimed);
  const prizes = prizesSnap.exists() ? prizesSnap.val() : [];
  const claimed = claimedSnap.exists() ? claimedSnap.val() : [];

  document.getElementById('remainingPrizes').innerHTML = `<h3>Remaining Prizes (${prizes.length})</h3><ul>${prizes.map(p => `<li>${p}</li>`).join('')}</ul>`;
  document.getElementById('claimedPrizes').innerHTML = `<h3>Claimed Prizes (${claimed.length})</h3><ul>${claimed.map(c => `<li>${c.name} won ${c.prize}</li>`).join('')}</ul>`;
}
