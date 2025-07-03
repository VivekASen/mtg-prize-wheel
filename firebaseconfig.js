import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

const dbRefs = {
  prizes: ref(db, 'prizes'),
  claimed: ref(db, 'claimed'),
  assignedMissions: ref(db, 'assignedMissions')
};

export { db, dbRefs, set, get, update, onValue, child };
