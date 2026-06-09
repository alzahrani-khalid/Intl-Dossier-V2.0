# Dev Workflow Inspection Report

Date: 2026-06-08

## Scope

Ran the Intl-Dossier development backend and frontend, then inspected one public workflow: unauthenticated login and registration entry, plus backend API validation through the frontend proxy.

## Dev Servers

- Backend: `PORT=5001 NODE_ENV=development pnpm --dir backend dev`
- Backend env source: root `.env.test` for Supabase keys, plus `backend/.env` for VAPID values
- Frontend: `VITE_DEV_PORT=5174 VITE_BACKEND_PROXY_TARGET=http://localhost:5001 pnpm --dir frontend dev --host 127.0.0.1`
- Frontend URL inspected: `http://127.0.0.1:5174/login`
- Screenshot: `reports/dev-workflow-login-2026-06-08.png`

## Health Checks

| Check                                                 | Result                                               |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Backend direct `GET http://127.0.0.1:5001/health`     | `200`, `{"status":"ok","environment":"development"}` |
| Frontend proxy `GET http://127.0.0.1:5174/api/health` | `200`, `{"status":"healthy","service":"api"}`        |
| Frontend route `GET http://127.0.0.1:5174/login`      | `200`, page title `GASTAT International Dossier`     |

## Workflow Inspected

1. Opened `/login`.
2. Confirmed visible UI: app title, email field, password field, remember-me control, forgot-password action, sign-in button, and sign-up link.
3. Clicked forgot password with no email entered.
4. Filled malformed email `not-an-email` and short password `short`, then attempted sign-in.
5. Called `POST /api/auth/login` through the Vite proxy with malformed payload.
6. Clicked sign-up and confirmed navigation to `/register`.

## Observed Results

- Login page rendered without page-level runtime errors.
- Empty forgot-password action produced the expected toast: `Enter your email first, then select forgot password`.
- Malformed email was blocked by browser validation: `Please include an '@' in the email address. 'not-an-email' is missing an '@'.`
- Backend validation through the frontend proxy returned structured `400` JSON:
  - `email`: `Invalid email address`
  - `password`: `Too small: expected string to have >=8 characters`
- Sign-up navigation reached `http://127.0.0.1:5174/register` and displayed `Create Your Account`.
- Browser console recorded one expected resource error from the intentional `400 Bad Request`; no uncaught page errors were observed.

## Findings

- The corrected dev pair works when the frontend proxy target is exported in the shell.
- A clean backend start fails if only `backend/.env` is loaded because Supabase variables are missing. Loading root `.env.test` supplies the required local test values.
- The initially running frontend on port `5173` was not a reliable target: `/api` requests were routed to macOS Control Center on port `5000` and returned `AirTunes/950.7.1` `403`. Running Vite with `VITE_BACKEND_PROXY_TARGET=http://localhost:5001` fixed the proxy path.

## Current State

- Backend dev server is running on port `5001`.
- Corrected frontend dev server is running on `http://127.0.0.1:5174`.
- No source-code edits were made for this inspection.
