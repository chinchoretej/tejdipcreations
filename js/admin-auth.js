import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar } from './utils.js';

initNavbar();

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

const errorMsg = document.getElementById('errorMsg');
const googleBtn = document.getElementById('googleSignInBtn');

async function checkAdminAccess() {
  try {
    await getDocs(query(collection(db, 'categories'), limit(1)));
    return true;
  } catch (e) {
    if (e.code === 'permission-denied' || (e.message && e.message.indexOf('permission') !== -1)) {
      return false;
    }
    return true;
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  var allowed = await checkAdminAccess();
  if (allowed) {
    window.location.href = 'dashboard.html';
  } else {
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

      var allowed = await checkAdminAccess();
      if (!allowed) {
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
