# Mappin

Territory mapping app. An Expo (React Native) client with a map and region
management UI, backed by an Express + SQLite API. In production both are served
from a single origin: the web client at `/` and the API at `/api`.

## Structure

| Path        | What it is                                             |
| ----------- | ------------------------------------------------------ |
| `app/`      | Expo Router screens (tabs, create-region, region view) |
| `src/`      | Client API layer, types, constants, web stubs          |
| `server/`   | Express + better-sqlite3 backend (`/api/*`)            |
| `assets/`   | App icon, splash, adaptive icon (placeholders for now) |

## Requirements

- Node 20+ (better-sqlite3 supports Node 20 through 26). Local dev here runs on
  Node 26; Replit runs Node 20.

## Local development

Install both packages:

```bash
npm install
npm --prefix server install
```

Run the two sides independently while developing:

```bash
# API (auto-reload) on http://localhost:3000, routes under /api
npm --prefix server run dev

# Expo client (choose a platform)
npm run web      # web
npm run ios      # iOS simulator
npm run android  # Android emulator
```

For web, the client calls a relative `/api` base, so run it behind the server or
set `EXPO_PUBLIC_API_URL`. For native, copy `.env.example` to `.env` and point
`EXPO_PUBLIC_API_URL` at an absolute URL ending in `/api`.

To run the production single-URL setup locally (web client and API from one
process):

```bash
npm run build   # exports web to web-build/ and compiles the server
npm run serve   # serves both on http://localhost:3000
```

## Deploying on Replit

The repo is configured to publish as a single URL where `/` serves the web
client and `/api` serves the backend, from one Express process. Config lives in
`.replit` and `replit.nix`.

### 1. Import from GitHub

1. In Replit, choose **Create Repl** then **Import from GitHub**.
2. Select `JesseMoure-Formic/Mappin` (branch `main`).
3. Replit reads `replit.nix` (Node 20 plus a build toolchain fallback for
   better-sqlite3) and `.replit` automatically.

### 2. Run in the workspace

Press **Run**. The configured command builds the web client and server, then
serves both:

```bash
npm run build && npm run serve
```

The app opens in the Replit webview. Verify `/api/health` returns
`{"ok":true}`.

### 3. Publish (Deploy)

1. Open the **Deploy** panel.
2. The deployment build and run commands are already set:
   - Build: `npm install && npm run build`
   - Run: `npm run serve`
3. Choose a deployment target (see the data persistence note below), then
   deploy. Replit provides the public URL.

### Data persistence (important)

The backend uses SQLite (`better-sqlite3`) writing to `server/data/`, which is a
local file on the deployment's disk.

- **Autoscale / Cloud Run** (the default in `.replit`) uses an ephemeral,
  non-shared filesystem. The database is wiped on every redeploy and is not
  shared across instances. Fine for a demo, not for retained data.
- **Reserved VM** runs a single instance with a persistent disk. Choose this in
  the Replit Deploy UI if the regions and points must survive redeploys.

To switch the default, change `deploymentTarget` in `.replit`, or select the
target in the Deploy panel.

### Environment variables

- `PORT` is provided by Replit; the server reads it automatically.
- No client env is needed on web (it uses the relative `/api` base). Native
  builds set `EXPO_PUBLIC_API_URL` as described above.

## Assets

`assets/icon.png`, `splash.png`, and `adaptive-icon.png` are solid-color
placeholders so the web export succeeds. Replace them with real brand art
(1024x1024 PNG) when ready. No config change is required.
