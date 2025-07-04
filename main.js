
// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  child
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMSBZ3SjddXMatw4iwUr8T8aFMY-O-N_I",
  authDomain: "mtg-prize-wheel.firebaseapp.com",
  databaseURL: "https://mtg-prize-wheel-default-rtdb.firebaseio.com",
  projectId: "mtg-prize-wheel",
  storageBucket: "mtg-prize-wheel.firebasestorage.app",
  messagingSenderId: "909073049822",
  appId: "1:909073049822:web:386b014a0be75f972fba4f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Missions
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

// Get user name from localStorage or prompt if not set
let playerName = localStorage.getItem("playerName");
if (!playerName) {
  playerName = prompt("Enter your name:");
  localStorage.setItem("playerName", playerName);
}

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcomeName").textContent = playerName;
  loadMissions();
});

function loadMissions() {
  const container = document.getElementById("missionsContainer");
  container.innerHTML = "";
  regularMissions.forEach((mission, index) => {
    const tile = document.createElement("div");
    tile.className = "mission-tile";
    tile.textContent = mission;
    tile.onclick = () => handleMissionClick(index, tile, mission);
    container.appendChild(tile);
  });
}

async function handleMissionClick(index, tile, missionText) {
  const userRef = ref(db, `players/${playerName}/missions`);
  const snapshot = await get(userRef);
  const data = snapshot.exists() ? snapshot.val() : {};

  if (data[index]) return;

  // Mark as completed visually and in DB
  tile.classList.add("completed");
  tile.textContent = `${missionText} — Rewarding...`;

  const prize = await assignPrize(playerName);

  await update(ref(db, `players/${playerName}/missions`), {
    [index]: { mission: missionText, prize: prize }
  });

  showGiftBoxPrize(prize);
  tile.textContent = `${missionText} — 🎁 ${prize}`;
}

async function assignPrize(playerName) {
  const prizesRef = ref(db, "prizes");
  const snapshot = await get(prizesRef);
  const prizePool = snapshot.exists() ? snapshot.val() : [];

  const availablePrizes = Object.keys(prizePool).filter(
    (k) => prizePool[k].claimedBy === undefined
  );

  if (availablePrizes.length === 0) return "No prizes left";

  const randomKey = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
  const prize = prizePool[randomKey].name;

  await update(ref(db, `prizes/${randomKey}`), {
    claimedBy: playerName,
    claimedAt: new Date().toISOString()
  });

  return prize;
}

function showGiftBoxPrize(prize) {
  const modal = document.getElementById("giftModal");
  modal.classList.add("open");

  const lid = document.querySelector(".chest-lid");
  const text = document.querySelector(".prize-text");

  lid.style.animation = "lidFlipOpen 1.5s ease-out forwards";
  text.textContent = `You won: ${prize}`;

  setTimeout(() => {
    modal.classList.remove("open");
  }, 4000);
}
