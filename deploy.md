# GitHub Pages Deployment Guide

This document explains how this TanStack Start app is configured for GitHub Pages deployment.

## The Challenge

TanStack Start is an **SSR framework** (powered by Nitro). It normally requires a Node.js server to render HTML at runtime. GitHub Pages only serves **static files** — it cannot run server-side code.

To deploy to GitHub Pages, we generate a static HTML shell that loads the client-side JavaScript bundle, turning the SSR app into a **client-rendered SPA**.

## How It Works

### 1. Build Pipeline

```
npm run build  ──>  Vite + Nitro build  ──>  .output/public/assets/
                                                    │
                                           scripts/generate-shell.mjs
                                                    │
                                           .output/public/index.html
                                           .output/public/404.html
```

- `vite build` compiles the app and outputs client assets to `.output/public/assets/`
- `scripts/generate-shell.mjs` scans the built assets, creates an `index.html` that loads them, and copies it to `404.html` (for SPA routing fallback on GitHub Pages)

### 2. Key Files

| File | Purpose |
|---|---|
| `scripts/build.mjs` | Runs `vite build`, verifies assets exist, then calls the shell generator |
| `scripts/generate-shell.mjs` | Reads hashed filenames from `.output/public/assets/` and writes `index.html` + `404.html` |
| `.github/workflows/deploy.yml` | GitHub Actions workflow triggered on push to `main` |

### 3. GitHub Actions Workflow

The workflow in `.github/workflows/deploy.yml`:

1. Checks out the repo
2. Installs dependencies (`npm ci`)
3. Runs `node scripts/build.mjs` (builds + generates index.html)
4. Uploads `.output/public/` as a Pages artifact
5. Deploys to GitHub Pages

### 4. Base Path

The `vite.config.ts` sets `base: "/TeamBoard/"` so all asset paths resolve correctly under `https://<user>.github.io/TeamBoard/`.

## Deployment Steps

1. Go to your repo **Settings → Pages**
2. Set **Source** to **"GitHub Actions"** (not "Deploy from a branch")
3. Push to `main` — the workflow runs automatically
4. Your site is live at `https://<username>.github.io/TeamBoard/`

## Manual Build & Preview

```bash
npm install
node scripts/build.mjs
# Output is in .output/public/
npx serve .output/public
```

## Important Notes

- The app runs fully client-side on GitHub Pages. SSR features (like `useServerFn`) won't work.
- TanStack Router handles all routing client-side.
- The `404.html` fallback ensures direct URL access (e.g., `/some-page`) works with SPA routing.
