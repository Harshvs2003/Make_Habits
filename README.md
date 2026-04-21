# HabitFlow

## Local setup

### 1) Server env
Copy `server/.env.example` to `server/.env`.

### 2) Client env
Copy `client/.env.example` to `client/.env`.

### 3) Run app
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

## Deployment envs

### Render (server)
Set these in Render service environment variables:
- `PORT` (Render usually injects this automatically)
- `CLIENT_ORIGIN=https://your-vercel-domain.vercel.app`

### Vercel (client)
Set this in Vercel project environment variables:
- `VITE_API_BASE=https://your-render-service.onrender.com`

## Notes
- Backend supports multiple client origins via comma-separated `CLIENT_ORIGIN`.
- If `CLIENT_ORIGIN` is blank, CORS allows all origins.