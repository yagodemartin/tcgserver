# Firebase Setup Guide - Tournament Tracker Authentication

## Quick Start (Demo Mode) ✅ ALREADY WORKING

**You can see the Tournament Tracker UI RIGHT NOW without any Firebase setup!**

### Access Demo Mode:
```
http://127.0.0.1:8787/?demo=true
```

**What you'll see:**
- ✅ "My Tournaments" section visible immediately
- ✅ 2 sample tournaments with matches
- ✅ Color-coded matches:
  - 🟢 Green = Win
  - 🔴 Red = Loss
  - 🟡 Yellow = Tie
- ✅ Stats calculation (W-L-T, Win Rate)
- ✅ All modals functional (Create Tournament, Add Match)

**Demo Mode Features:**
- Show complete UI without authentication
- Sample data to demonstrate functionality
- All interactions work (modals open, forms visible)
- No backend calls (uses mock data in browser)

---

## Full Production Setup (Firebase Auth + Firestore)

To save real tournaments and matches that persist across sessions, follow these steps:

### Phase 1: Create Firebase Project (5 minutes)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Click "Add project" or "Create a project"

2. **Configure Project**
   - Project name: `tcgserver-dev` (or your choice)
   - Accept Firebase terms
   - **Disable Google Analytics** (optional for MVP, you can enable later)
   - Click "Create project"
   - Wait ~30 seconds for setup to complete

### Phase 2: Enable Google Authentication (3 minutes)

1. **Navigate to Authentication**
   - In Firebase Console sidebar → Click "Authentication"
   - Click "Get started" button

2. **Enable Google Sign-In**
   - Click "Sign-in method" tab
   - Find "Google" in the providers list
   - Click "Google" → Toggle to "Enabled"
   - Configure OAuth consent:
     - **Project support email:** Your email address
     - (Other fields are optional)
   - Click "Save"

### Phase 3: Create Firestore Database (5 minutes)

1. **Navigate to Firestore**
   - In Firebase Console sidebar → Click "Firestore Database"
   - Click "Create database"

2. **Configure Database**
   - **Start mode:** Choose "Start in test mode" (we'll add security rules next)
   - Click "Next"
   - **Location:** Choose `us-central1` (or closest to your users)
   - Click "Enable"
   - Wait ~1 minute for database creation

3. **Add Security Rules** (CRITICAL for data protection)
   - Click "Rules" tab in Firestore
   - Replace ALL existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User tournaments - users can only access their own
    match /user_tournaments/{docId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }

    // User matches - users can only access their own
    match /user_matches/{docId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

   - Click "Publish"

### Phase 4: Get Firebase Credentials (2 minutes)

1. **Register Web App**
   - In Firebase Console → Click gear icon ⚙️ (Project settings)
   - Scroll down to "Your apps" section
   - Click the Web icon `</>`
   - **App nickname:** `TCG Companion Web`
   - **Don't check** "Also set up Firebase Hosting"
   - Click "Register app"

2. **Copy Configuration**
   - Copy the firebaseConfig object values

### Phase 5: Update Frontend Code (2 minutes)

Edit `src/ui/demo.html.js` around line 728:

Replace placeholder values with your actual Firebase config.

### Phase 6: Configure Backend (3 minutes)

Edit `wrangler.toml` and add:

```toml
[vars]
FIREBASE_PROJECT_ID = "your-project-id"
FIREBASE_API_KEY = "your-api-key"
```

### Phase 7: Test

1. Restart server: `npm run dev`
2. Open: `http://127.0.0.1:8787`
3. Click "Sign in with Google"
4. Create a tournament
5. Add a match
6. Verify data persists after reload

---

## Demo Mode vs Production Mode

**Demo Mode** (`?demo=true`):
- ✅ Works immediately (no setup)
- ✅ Shows complete UI
- ❌ Data doesn't persist (browser only)
- ❌ No authentication

**Production Mode** (after Firebase setup):
- ✅ Real authentication
- ✅ Data persists in Firestore
- ✅ Secure (user isolation)
- ✅ Accessible from any device

---

## Cost: $0 (Free Tier)

Firebase Spark Plan includes:
- 50,000 reads/day
- 20,000 writes/day
- Unlimited auth users

Estimated MVP usage: ~1,000 operations/day ✅

---

**Current Status:**
- ✅ Demo mode working NOW
- ⏳ Firebase setup: 20-30 minutes
