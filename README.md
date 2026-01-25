# Revo ERP Mobile App

Vue 3 + Vite mobile app for Revo ERP, featuring Vant 4, Pinia, Vue Router, Axios, and Capacitor for future iOS/Android builds.

## Tech Stack

- **Framework:** Vue 3 + Vite
- **UI:** Vant 4 (mobile components)
- **State:** Pinia
- **Router:** Vue Router 4
- **HTTP:** Axios
- **Native:** Capacitor

## Setup

```bash
npm install
```

Copy `env.example` to `.env.development` or `.env.production` and set:

```
VITE_API_BASE_URL=http://localhost:3000
```

For native builds, set `VITE_API_BASE_URL` to your deployed API gateway (e.g. `https://api.example.com`).

## Scripts

| Command    | Description                    |
|------------|--------------------------------|
| `npm run dev` | Start dev server (port 8082)   |
| `npm run build` | Production build               |
| `npm run preview` | Preview production build       |
| `npm run cap:sync` | Sync `dist` to native projects |
| `npm run cap:ios` | Build, sync, and open Xcode    |
| `npm run cap:android` | Build, sync, and open Android Studio |

## Running in Browser

1. Ensure the API gateway and backend services are running (see project root).
2. `npm run dev` and open http://localhost:8082. The dev server proxies `/api` to `http://localhost:3000`.

## Native (iOS / Android)

1. Build the app: `npm run build`
2. Add a platform (once): `npx cap add ios` and/or `npx cap add android`
3. Sync and open: `npm run cap:ios` or `npm run cap:android`

For devices/simulators, point `VITE_API_BASE_URL` to an URL reachable from the device (e.g. your machine’s LAN IP or a deployed API).

## Features

- **Auth:** Login, logout, profile, change password
- **Dashboard:** Member, asset, and event stats
- **Finance:** Transactions list, create/edit, summary; accounts and reports (basic)
- **Assets:** List, create/edit, assign, history
- **Schedule:** Calendar, events list, create/edit event
- **Members:** List, create/edit, assign role
- **Me:** Profile, settings, members, logout

## Permission Gating

The app uses `hasPermission()` from `@/utils/permission` where needed. Backend enforces permissions; the UI hides or disables actions when the user lacks the required permission.
