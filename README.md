# HabitFlow

## Local setup

### 1) Server env
Copy `server/.env.example` to `server/.env`.

### 2) Client env
Copy `client/.env.example` to `client/.env`.

### 3) Start MongoDB
Run MongoDB locally (or use MongoDB Atlas) and set `MONGODB_URI` in `server/.env`.

### 4) Run app
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

### Optional: import old `data.json` into MongoDB
```bash
cd server
npm run migrate:json
```

## Deployment envs

### Render (server)
Set these in Render service environment variables:
- `PORT` (Render usually injects this automatically)
- `CLIENT_ORIGIN=https://your-vercel-domain.vercel.app`
- `MONGODB_URI=mongodb+srv://...` (Atlas recommended)
- `MONGODB_DB_NAME=habitflow`

### Vercel (client)
Set this in Vercel project environment variables:
- `VITE_API_BASE=https://your-render-service.onrender.com`

## Notes
- Backend supports multiple client origins via comma-separated `CLIENT_ORIGIN`.
- If `CLIENT_ORIGIN` is blank, CORS allows all origins.
- Backend now uses MongoDB for persistent data (`habits`, `entries`, `day_status`).
