import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

// Public web-app configuration from Firebase Project Settings > Your apps.
// Do not put service-account credentials or private server keys in this file.
const firebaseConfig = {
  apiKey: "AIzaSyCUQafqXUZn4uHohqKStgFDGlFsAdTHy5U",
  authDomain: "kartik-music-player.firebaseapp.com",
  projectId: "kartik-music-player",
  storageBucket: "kartik-music-player.firebasestorage.app",
  messagingSenderId: "75024519655",
  appId: "1:75024519655:web:51e2e641ea2cccb572ad42"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const $ = (selector) => document.querySelector(selector);
const modal = $("#authModal");
const form = $("#authForm");
const emailInput = $("#authEmail");
const passwordInput = $("#authPassword");
const accountButton = $("#accountButton");
const submitButton = $("#authSubmit");
const notice = $("#authNotice");
const logoutButton = $("#authLogout");
let mode = "signin";
let currentUser = null;

function showNotice(message, kind = "") {
  notice.textContent = message;
  notice.className = `auth-notice show ${kind}`;
}
function clearNotice() {
  notice.textContent = "";
  notice.className = "auth-notice";
}
function setMode(nextMode) {
  mode = nextMode;
  clearNotice();
  const signedIn = Boolean(currentUser);
  $("#authTitle").textContent = signedIn ? "Your account" : mode === "signup" ? "Create account" : "Sign in";
  $("#authDescription").textContent = signedIn
    ? `Signed in as ${currentUser.email || "your account"}. Cloud playlist syncing will be added next.`
    : mode === "signup" ? "Create an account for Kartik Music Player." : "Sign in to your Kartik Music account.";
  form.hidden = signedIn;
  $("#authForgot").hidden = signedIn || mode === "signup";
  $(".auth-switch-row").hidden = signedIn;
  logoutButton.hidden = !signedIn;
  submitButton.textContent = mode === "signup" ? "Create account" : "Sign in";
  $("#authSwitchText").textContent = mode === "signup" ? "Already have an account?" : "New here?";
  $("#authSwitch").textContent = mode === "signup" ? "Sign in" : "Create account";
  passwordInput.autocomplete = mode === "signup" ? "new-password" : "current-password";
}
function openModal() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  setMode(currentUser ? mode : "signin");
  if (!currentUser) emailInput.focus();
}
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  clearNotice();
}
function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email. Try signing in.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account found for this email. Create an account first.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Wait a while and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection."
  };
  return messages[error.code] || error.message || "Something went wrong. Please try again.";
}

accountButton.addEventListener("click", openModal);
$("#authClose").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
$("#authSwitch").addEventListener("click", () => setMode(mode === "signup" ? "signin" : "signup"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearNotice();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  submitButton.disabled = true;
  submitButton.textContent = mode === "signup" ? "Creating…" : "Signing in…";
  try {
    if (mode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
      showNotice("Account created successfully.", "success");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      showNotice("Signed in successfully.", "success");
    }
    passwordInput.value = "";
  } catch (error) {
    showNotice(friendlyError(error), "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = mode === "signup" ? "Create account" : "Sign in";
  }
});

$("#authForgot").addEventListener("click", async () => {
  clearNotice();
  const email = emailInput.value.trim();
  if (!email) {
    showNotice("Enter your email above first, then click Forgot password again.", "error");
    emailInput.focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showNotice("If an account exists for that address, a password-reset email has been sent.", "success");
  } catch (error) {
    showNotice(friendlyError(error), "error");
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showNotice("You have signed out.", "success");
  } catch (error) {
    showNotice(friendlyError(error), "error");
  }
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  accountButton.textContent = user ? (user.email?.split("@")[0] || "Account") : "Sign in";
  accountButton.title = user ? `Signed in as ${user.email}` : "Sign in or create an account";
  if (modal.classList.contains("open")) setMode(mode);
});
