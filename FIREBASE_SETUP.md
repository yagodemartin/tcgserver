# Firebase Setup Instructions

## Overview
Tournament Tracker features require Firebase for authentication and data storage.

## Setup Steps

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name (e.g., "tcgserver-dev")
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console → **Authentication** → Get started
2. Click **Sign-in method** tab
3. Enable **Google** provider
4. Add authorized domain: `localhost` (for dev)
5. Later add your production domain

### 3. Create Firestore Database

1. In Firebase Console → **Firestore Database** → Create database
2. Start in **production mode**
3. Select region: `us-central1` (or closest to you)
4. Click "Enable"

### 4. Configure Security Rules

Go to **Firestore** → **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User tournaments
    match /user_tournaments/{docId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }

    // User matches
    match /user_matches/{docId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click **Publish**.

### 5. Get Firebase Credentials

1. **Project ID**:
   - Go to Project Settings (gear icon)
   - Copy "Project ID"

2. **API Key**:
   - Project Settings → General tab
   - Under "Your apps" → Web app
   - If no app exists, click "Add app" → Web
   - Copy "API Key" (Web API Key)

### 6. Configure Cloudflare Worker

Set secrets using Wrangler CLI:

```bash
npx wrangler secret put FIREBASE_PROJECT_ID
# Paste your project ID

npx wrangler secret put FIREBASE_API_KEY
# Paste your API key
```

### 7. Test Authentication

Once configured, test the endpoints:

```bash
# Without auth (should return 401)
curl http://localhost:8787/v1/user/tournaments

# With valid token (get from Firebase Auth)
curl -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  http://localhost:8787/v1/user/tournaments
```

## Firebase Web Config (for Frontend)

Add to your HTML `<head>`:

```html
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
  import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  window.signInWithGoogle = async function() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      localStorage.setItem('idToken', idToken);
      console.log('Logged in:', result.user.displayName);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
</script>
```

## Free Tier Limits

Firebase Spark (free) plan includes:
- **Authentication**: Unlimited users
- **Firestore**:
  - 1GB storage
  - 50K reads/day
  - 20K writes/day
  - 20K deletes/day

Sufficient for ~100 active users in MVP.

## Production Deployment

When deploying to production:

1. Add production domain to Firebase Auth authorized domains
2. Update Firestore indexes if queries are slow
3. Set secrets in production environment:
   ```bash
   npx wrangler secret put FIREBASE_PROJECT_ID --env production
   npx wrangler secret put FIREBASE_API_KEY --env production
   ```

## Troubleshooting

**"Firebase not configured" error:**
- Verify secrets are set: `npx wrangler secret list`
- Check wrangler.toml has correct binding names

**401 Unauthorized:**
- Verify Firebase ID token is valid and not expired
- Check Firestore security rules allow the operation
- Ensure userId matches between token and document

**Firestore permission denied:**
- Review security rules
- Verify auth token contains correct `uid`
- Check document has correct `userId` field
