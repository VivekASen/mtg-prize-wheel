// firebaseconfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  child
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Replace with your actual config:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const dbRefs = {
  prizes: ref(db, 'prizes'),
  claimed: ref(db, 'claimed'),
  assignedMissions: ref(db, 'assignedMissions'),
  playerChecks: ref(db, 'playerChecks'),
};

export { db, dbRefs, set, get, update, onValue, child };
