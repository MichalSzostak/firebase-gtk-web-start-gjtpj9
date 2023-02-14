// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import {
  getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  where
} from 'firebase/firestore';



import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {

    apiKey: "AIzaSyC_xBNDRUJyhYCbB7HOjcHZHWzCLDbD1wA",
  
    authDomain: "multiverse-test-cd1a1.firebaseapp.com",
  
    projectId: "multiverse-test-cd1a1",
  
    storageBucket: "multiverse-test-cd1a1.appspot.com",
  
    messagingSenderId: "761157331004",
  
    appId: "1:761157331004:web:7c3a8d5a428941edc7bb39",
  
    measurementId: "G-E4PRQNBX6Q"
  
  };
  

  initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  const ui = new firebaseui.auth.AuthUI(auth);


  // Listen to RSVP button clicks
  startRsvpButton.addEventListener("click",
   () => {
    if (auth.currentUser) {
      // User is signed in; allows user to sign out
      signOut(auth);
    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });
  

  // Listen to the form submission
  form.addEventListener('submit', async e => {
    // Prevent the default form redirect
    e.preventDefault();
    // Write a new message to the database collection "guestbook"
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid
    });
    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });
  
  onAuthStateChanged(auth, user => {
    if (user) {
      startRsvpButton.textContent = 'LOGOUT';
      guestbookContainer.style.display = 'block';
      subscribeGuestbook()
      subscribeCurrentRSVP(user);
    } else {
      startRsvpButton.textContent = 'RSVP';
      guestbookContainer.style.display = 'none';
      unsubscribeGuestbook()
      unsubscribeCurrentRSVP();
    }
  });

  // Subscribe to guestbook updates
  function subscribeGuestbook(){

    const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));

    onSnapshot(q, snaps => {
      guestbook.innerHTML = '';
      snaps.forEach(doc => {
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + ': ' + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
  }


// Unsubscribe from guestbook updates
function unsubscribeGuestbook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}

  // Listen to RSVP responses
  rsvpYes.onclick = async () => {
    // Get a reference to the user's document in the attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);
    // If they RSVP'd yes, save a document with attendi()ng: true
    try {
      await setDoc(userRef, {
        attending: true
      });
    } catch (e) {
      console.error(e);
    }
  };
  rsvpNo.onclick = async () => {
    // Get a reference to the user's document in the attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);
    // If they RSVP'd yes, save a document with attending: true
    try {
      await setDoc(userRef, {
        attending: false
      });
    } catch (e) {
      console.error(e);
    }

  };
  
  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );
  
  const unsubscribe = onSnapshot(attendingQuery, snap => {
    const newAttendeeCount = snap.docs.length;
    numberAttending.innerHTML = newAttendeeCount + ' people going';
  });

  // Listen for attendee list
  function subscribeCurrentRSVP(user) {
    const ref = doc(db, 'attendees', user.uid);
    rsvpListener = onSnapshot(ref, doc => {
      if (doc && doc.data()) {
        const attendingResponse = doc.data().attending;

        // Update css classes for buttons
        if (attendingResponse) {
          rsvpYes.className = 'clicked';
          rsvpNo.className = '';
        } else {
          rsvpYes.className = '';
          rsvpNo.className = 'clicked';
        }
      }
    });
  }

  function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
      rsvpListener();
      rsvpListener = null;
    }
    rsvpYes.className = '';
    rsvpNo.className = '';
  }

  
}
main();
