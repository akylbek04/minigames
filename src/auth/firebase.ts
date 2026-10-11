import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// A Firebase web config only names the project; it is public by design.
// Access is controlled in the Firebase console (enabled providers and
// authorized domains), not by keeping these values secret.
const firebaseConfig = {
  apiKey: "AIzaSyCxVAR2RCtYhVbe05ZTWxsGR-nH-HZbZr0",
  authDomain: "minigames-d5218.firebaseapp.com",
  projectId: "minigames-d5218",
  storageBucket: "minigames-d5218.firebasestorage.app",
  messagingSenderId: "922956827581",
  appId: "1:922956827581:web:d13634c8c71cbeff1760d4",
};

export const firebaseAuth = getAuth(initializeApp(firebaseConfig));
