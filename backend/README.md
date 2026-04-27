# Impact Learning Platform Backend

## Current backend foundation

This backend handles:

- Passkey creation
- Passkey validation
- Class creation endpoint
- Class status update endpoint
- Firebase Admin connection

## Required environment variables

Create a real `.env` file inside `/backend` using `.env.example`.

Required:

FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

## Local run

npm install
npm start

## Health check

http://localhost:5000/

## Next backend phases

1. Connect frontend passkey generation to backend.
2. Connect passkey validation to backend.
3. Move class creation to backend.
4. Add Google Calendar / Meet API.
5. Add class duration and review automation.
