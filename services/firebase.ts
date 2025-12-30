import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";

// Your Firebase project's configuration
const firebaseConfig = {
  apiKey: "AIzaSyAt2FVpcUpehBrh7x1MgxmTeFLloeJTsYs",
  authDomain: "life-sync-988cd.firebaseapp.com",
  databaseURL: "https://life-sync-988cd-default-rtdb.firebaseio.com",
  projectId: "life-sync-988cd",
  storageBucket: "life-sync-988cd.firebasestorage.app",
  messagingSenderId: "284451597380",
  appId: "1:284451597380:web:9478487bebe5aa73e2a011",
  measurementId: "G-WBX902VNE8"
};

// Initialize Firebase App
console.log("Initializing Firebase App (v10.8.0 via gstatic)...");
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
export const auth = getAuth(app);          
export const db = getFirestore(app);       
export const database = getDatabase(app);  

console.log("Firebase Services Initialized Successfully");

// Monitor connection state
const connectedRef = ref(database, ".info/connected");
onValue(connectedRef, (snapshot) => {
  if (snapshot.val() === true) {
    console.log("Firebase Realtime Database: CONNECTED");
  } else {
    console.log("Firebase Realtime Database: Checking connection...");
  }
});