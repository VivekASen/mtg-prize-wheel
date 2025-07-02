
let playerName = "";
let secretMission = "";
const secretMissions = [
  "🪑 The Great Drift: Move your playmat away from everyone. 1 spin per 3 inches before someone notices.",
  "👻 Token Invasion: Add random tokens to your battlefield. 1 spin per token before getting caught.",
  "📖 Flavor Oracle: Quote flavor text like it’s life advice. Get 2 spins if someone takes it seriously.",
  "⚖️ Rules Lawyer Lite: Make up a fake rule and convince someone. 2 spins if they believe you.",
  "🐘 Commander Creep: Inch your commander toward another player. 1 spin per 2 inches. Max 10.",
  "🤝 Deal or No Deal: Propose a deal every turn. 1 spin per 2 deals. Max 5.",
  "🧦 Proxy Chaos: Use weird items as proxies. 1 spin per item. Max 5.",
  "📺 Commercial Break: Stand and give a fake excuse. 1 spin per excuse. Max 3.",
  "🥤 Drink Thief: Steal drinks without being caught. 1 spin per drink. Max 5.",
  "📸 Tony Surveillance: Take stealthy photos of Tony. 1 spin per photo. Max 5.",
  "🧽 The Clean-Up Step: Tidy others’ cards/dice. 1 spin per 2 items. Max 5.",
  "👃 The Sniff Test: Smell someone’s deck/playmat. 1 spin per unchallenged sniff."
];

const regularMissions = [
  "Cast your commander",
  "Deal the first combat damage",
  "Destroy a creature with a spell",
  "Give another player mana/life/card",
  "Reanimate a creature",
  "Play a creature of every color",
  "Eliminate a player in one turn",
  "Control 3+ creatures of the same type",
  "Use a political trick",
  "Cast a spell with cascade or chaos",
  "Go from lowest life to not-last place"
];

function submitName() {
  const nameInput = document.getElementById("playerName");
  playerName = nameInput.value.trim();
  if (!playerName) return;
  localStorage.setItem("playerName", playerName);

  const mission = secretMissions[Math.floor(Math.random() * secretMissions.length)];
  secretMission = mission;
  localStorage.setItem("secretMission", mission);

  document.getElementById("nameEntry").classList.add("hidden");
  document.getElementById("secretMission").innerHTML = `<h2>Your Secret Mission</h2><p>${mission}</p>`;
  document.getElementById("secretMission").classList.remove("hidden");

  loadMissionTracker();
}

function loadMissionTracker() {
  document.getElementById("missionTracker").classList.remove("hidden");
  const ul = document.getElementById("missionList");
  ul.innerHTML = "";
  regularMissions.forEach((m, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<input type="checkbox" id="m${i}" onchange="checkMissions()" /> ${m}`;
    ul.appendChild(li);
  });
}

function checkMissions() {
  const checked = document.querySelectorAll("#missionList input:checked").length;
  if (checked >= 1) {
    document.getElementById("prizeInput").classList.remove("hidden");
    document.getElementById("wheelSection").classList.remove("hidden");
    document.getElementById("secretComplete").classList.remove("hidden");
  }
}

let prizes = [];

function loadPrizes() {
  const text = document.getElementById("prizeList").value.trim();
  if (text) {
    prizes = text.split("\n").map(p => p.trim()).filter(p => p);
  }
  const file = document.getElementById("uploadFile").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      prizes = e.target.result.split("\n").map(p => p.trim()).filter(p => p);
    };
    reader.readAsText(file);
  }
}

function spinWheel() {
  if (prizes.length === 0) {
    alert("No prizes loaded.");
    return;
  }
  const index = Math.floor(Math.random() * prizes.length);
  const prize = prizes.splice(index, 1)[0];
  document.getElementById("result").innerText = `${playerName} won: ${prize}`;
  sendToDiscord(playerName, prize);
}

function bonusSpin() {
  document.getElementById("result").innerText = `${playerName} earned a BONUS spin!`;
}

function sendToDiscord(name, prize) {
  const webhook = "YOUR_DISCORD_WEBHOOK_URL";
  if (webhook.includes("YOUR")) return;
  fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `🎡 ${name} just spun the wheel and won **${prize}**!` })
  });
}
