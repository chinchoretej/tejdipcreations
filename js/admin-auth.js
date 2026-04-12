import { auth } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initNavbar } from './utils.js';

initNavbar();

const ALLOWED_ADMINS = [
  'chinchoretej@gmail.com',
  'dipalishirude7@gmail.com'
];

function isAllowed(email) {
  return email && ALLOWED_ADMINS.includes(email.toLowerCase());
}

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

const errorMsg = document.getElementById('errorMsg');
const googleBtn = document.getElementById('googleSignInBtn');

onAuthStateChanged(auth, (user) => {
  if (user && isAllowed(user.email)) {
    window.location.href = 'dashboard.html';
  } else if (user) {
    signOut(auth);
    showError('This Google account (' + user.email + ') is not authorized as admin.');
  }
});

function showError(msg) {
  if (!errorMsg) return;
  errorMsg.textContent = msg;
  errorMsg.classList.add('show');
}

if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    errorMsg.classList.remove('show');

    try {
      const result = await signInWithPopup(auth, googleProvider);

      if (!isAllowed(result.user.email)) {
        await signOut(auth);
        showError('Access denied. "' + result.user.email + '" is not an authorized admin account.');
        return;
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        sessionStorage.setItem('gdrive_token', credential.accessToken);
        sessionStorage.setItem('gdrive_token_time', Date.now().toString());
      }

      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        showError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        showError('Pop-up blocked. Please allow pop-ups for this site.');
      } else {
        showError('Sign-in failed: ' + (err.message || err.code || 'Unknown error'));
      }
    }
  });
}
