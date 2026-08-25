# Membership mobile (Expo)

Small React Native client for the membership API (login, home, projects, events, community, profile).

Android application id: `com.ibtikar.vms`

## Prerequisites

- Node.js 20+
- Expo Go on a phone, or an Android emulator / iOS simulator
- Membership backend running (`backend/` via `npm run dev` or a deployed Worker)

## Setup

```bash
cd mobile
cp .env.example .env
npm install
```

Edit `.env` and set `EXPO_PUBLIC_API_BASE` to your API root including `/api`:

- Emulator / simulator on the same machine: `http://127.0.0.1:5931/ms/membership-app/api`
- Physical device: `http://<your-lan-ip>:5931/ms/membership-app/api` (not `localhost`)
- Deployed Worker: `https://<host>/ms/membership-app/api`

## Run

```bash
npm start
```

Then open the project in Expo Go, or press `a` / `i` for Android / iOS.

## Android APK (EAS + GitHub)

Dev branch builds an internal APK via [`.github/workflows/mobile-dev.yml`](../.github/workflows/mobile-dev.yml).

### One-time local setup

1. Create an Expo account and log in:
   ```bash
   cd mobile
   npx eas-cli login
   npx eas-cli init
   ```
   Commit the generated `expo.extra.eas.projectId` in `app.json`.

2. In GitHub → **Settings → Secrets and variables → Actions** (environment **dev**):
   - Secret: `EXPO_TOKEN` — Expo access token from https://expo.dev/settings/access-tokens
   - Variable: `EXPO_PUBLIC_API_BASE` — deployed API root including `/api`

### Trigger

- Push to `dev` under `mobile/**`, or run **(dev) [mobile] EAS Android APK** manually.
- Build runs on EAS (`--profile preview`, APK). Download the artifact from the Expo dashboard / build URL in the job log.

### Local APK build (optional)

```bash
cd mobile
npx eas-cli build -p android --profile preview
```

## Auth notes

- Login still requires Telegram bot activation (same as the web app).
- The app sends `X-Client: mobile` so the backend returns a `refreshToken` in JSON (stored in SecureStore). Web cookie refresh is unchanged.

## Scripts

| Command           | Description           |
|-------------------|-----------------------|
| `npm start`       | Start Expo dev server |
| `npm run android` | Open Android          |
| `npm run ios`     | Open iOS (macOS only) |
| `npm run web`     | Run in browser        |
