import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  child,
  onValue,
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

const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

function launchConfetti() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const colors = ["#ff0", "#f90", "#0cf", "#6f6", "#f66", "#f0f"];

  (function frame() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;

    for (let i = 0; i < 20; i++) {
      confettiCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      confettiCtx.fillRect(
        Math.random() * confettiCanvas.width,
        Math.random() * confettiCanvas.height,
        5,
        5
      );
    }

    requestAnimationFrame(frame);
  })();
}

async function fetchPrizes() {
  const snapshot = await get(ref(db, "prizes"));
  return snapshot.exists() ? snapshot.val() : [];
}

async function markPrizeClaimed(userId, prize) {
  await update(ref(db, `users/${userId}/claimedPrizes`), {
    [Date.now()]: prize,
  });

  const prizeRef = ref(db, "prizes");
  const snapshot = await get(prizeRef);
  if (snapshot.exists()) {
    const prizes = snapshot.val();
    const index = prizes.indexOf(prize);
    if (index !== -1) {
      prizes.splice(index, 1);
      await set(prizeRef, prizes);
    }
  }
}

function showTreasureChestPrize(prizeText) {
  const modal = document.createElement("div");
  modal.className = "gift-modal";

  const chest = document.createElement("div");
  chest.className = "treasure-chest";

  const lid = document.createElement("div");
  lid.className = "chest-lid";

  const base = document.createElement("div");
  base.className = "chest-base";

  const prize = document.createElement("div");
  prize.className = "prize-text";
  prize.innerText = prizeText;

  chest.appendChild(lid);
  chest.appendChild(base);
  modal.appendChild(chest);
  modal.appendChild(prize);
  document.body.appendChild(modal);

  launchConfetti();

  setTimeout(() => {
    document.body.removeChild(modal);
  }, 4000);
}

window.startApp = async () => {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    const name = prompt("Enter your name:");
    if (!name) return;
    localStorage.setItem("userId", name);
  }

  const missions = [
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

  const claimedMissionsSnap = await get(ref(db, `users/${userId}/completedMissions`));
  const claimedMissions = claimedMissionsSnap.exists() ? claimedMissionsSnap.val() : {};

  const container = document.getElementById("missionsContainer");
  container.innerHTML = "";

  const prizes = await fetchPrizes();

  missions.forEach((mission, index) => {
    const div = document.createElement("div");
    div.className = "mission-tile";
    div.textContent = mission;

    if (claimedMissions[index]) {
      div.classList.add("completed");
      div.textContent = `${mission} – ${claimedMissions[index]}`;
    } else {
      div.onclick = async () => {
        div.classList.add("completed");
        div.classList.remove("selected");

        const prize = prizes[Math.floor(Math.random() * prizes.length)];
        div.textContent = `${mission} – ${prize}`;
        div.onclick = null;

        await set(ref(db, `users/${userId}/completedMissions/${index}`), prize);
        await markPrizeClaimed(userId, prize);
        showTreasureChestPrize(prize);
      };
    }

    container.appendChild(div);
  });
};

window.onload = () => {
  window.startApp();
};
