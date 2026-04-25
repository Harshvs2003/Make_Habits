# HabitFlow

## Local setup

### 1) Server env
Copy `server/.env.example` to `server/.env` and fill values.

### 2) Client env
Copy `client/.env.example` to `client/.env` and fill values.

### 3) Start MongoDB
Run MongoDB locally (or use MongoDB Atlas) and set `MONGODB_URI` in `server/.env`.

### 4) Install and run
```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

## Auth and billing envs

### Server
- `PORT`
- `CLIENT_ORIGIN`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_CURRENCY` (default `INR`)
- `RAZORPAY_PRO_AMOUNT_INR`
- `RAZORPAY_PREMIUM_AMOUNT_INR`

### Client
- `VITE_API_BASE`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

## Behavior implemented
- Google sign-in via Firebase Auth.
- API requests require Firebase ID token.
- MongoDB data is private per user (`uid` scoped): habits, entries, day status.
- Plan system: `free`, `pro`, `premium`.
- Free plan habit cap enforced on backend (5 habits).
- Razorpay order creation + payment signature verification.
- Pricing page in client for upgrades.

## Optional: import old `data.json` into MongoDB
```bash
cd server
npm run migrate:json
```
Uses `MIGRATION_UID` from server env.

## Notes
- Backend supports multiple client origins via comma-separated `CLIENT_ORIGIN`.
- If `CLIENT_ORIGIN` is blank, CORS allows all origins.
- Plans and prices are controlled on server env variables.
