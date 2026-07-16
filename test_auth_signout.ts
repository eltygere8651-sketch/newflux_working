import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";

const app = initializeApp({ apiKey: "test", projectId: "test" });
const auth = getAuth(app);
console.log(typeof auth.signOut);
