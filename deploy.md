# GitHub Pages Deployment Guide

This app is a **pure React + Vite SPA** (no SSR). It's designed to deploy to GitHub Pages easily.

## How It Works

### Build Pipeline

```
npm run build  ──>  Vite build  ──>  dist/ (index.html + assets/ + 404.html)
```

- `vite build` compiles the React app into static files in `dist/`
- `scripts/build.mjs` runs `vite build` then copies `index.html` to `404.html` (for SPA routing fallback)

### Key Files

| File | Purpose |
|---|---|
| `index.html` | Vite entry point — loads `src/main.tsx` |
| `src/main.tsx` | React entry — `createRoot` + providers + auth gating |
| `scripts/build.mjs` | Build script that copies index.html → 404.html |
| `.github/workflows/deploy.yml` | GitHub Actions workflow |

### GitHub Actions Workflow

The workflow in `.github/workflows/deploy.yml`:

1. Checks out the repo
2. Installs dependencies (`npm ci`)
3. Runs `node scripts/build.mjs` (builds + copies 404.html)
4. Uploads `dist/` as a Pages artifact
5. Deploys to GitHub Pages

### Base Path

`vite.config.ts` sets `base: "/TeamBoard/"` so all asset paths resolve correctly under `https://<user>.github.io/TeamBoard/`.

## Deployment Steps

1. Go to your repo **Settings → Pages**
2. Set **Source** to **"GitHub Actions"** (not "Deploy from a branch")
3. Push to `main` — the workflow runs automatically
4. Your site is live at `https://<username>.github.io/TeamBoard/`

## Manual Build & Preview

```bash
npm install
npm run build
npx serve dist
```

## Important Notes

- This is a pure SPA — all rendering happens client-side
- The `404.html` fallback ensures direct URL access works with client-side routing
- React 19 + Vite 8 + Tailwind CSS v4



## Backend (Render / Railway) + frontend wiring

The API lives in `backend/` (Express + MongoDB).

1. Create a MongoDB Atlas cluster and copy its connection string.
2. Deploy `backend/` (Render blueprint provided in `backend/render.yaml`):
   - Build: `npm install && npm run build`, Start: `npm start`
   - Health check: `/api/health`
   - Env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`
     (`CLIENT_ORIGIN` is a comma separated list, e.g.
     `http://localhost:5173,https://<username>.github.io`)
3. In the GitHub repo, add a **repository secret** `VITE_API_URL` pointing at
   the deployed API, e.g. `https://teamboard-api.onrender.com/api`.
   The Pages workflow injects it at build time.
4. Without `VITE_API_URL` the app still runs, but in offline mode: auth and
   tasks stay in the browser's localStorage.

See `.env.example` (frontend) and `backend/.env.example` for the full list.
