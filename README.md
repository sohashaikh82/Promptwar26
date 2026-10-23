# CivicSense AI

## Run locally

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to a Google AI Studio API key. Keep `.env` private; it is git-ignored.
2. In one PowerShell terminal, start the API:

   ```powershell
   npm run server
   ```

3. In a second PowerShell terminal, start the Vite app:

   ```powershell
   npm run dev
   ```

Open the local URL printed by Vite. The app proxies `/api` requests to the Express backend on port 3001. Complaint analysis requires a configured Gemini key and a successful API request; there is no local/mock AI fallback.

## Deploy to Render

1. Push this project to a GitHub repository.
2. In Render, choose **New → Blueprint**, connect the repository, and deploy the detected `render.yaml`.
3. Add `GEMINI_API_KEY` in the Render service's environment settings, then redeploy. Do not commit `.env` or put the key in Vite variables.

The Render service builds the Vite app and serves it, together with the `/api` endpoint, from Express. `/api/health` is used for the service health check. The deployed app can load without a Gemini key, but complaint analysis will return a setup error until the key is configured.

## Complaint analysis endpoint

`POST /api/analyze-complaint`

Request JSON: `{ "description": "..." }` (8–1200 characters).

Success returns `category`, `severity`, `priorityScore` (0–100), `responsibleDepartment`, `explanation`, and `recommendedAction`. Invalid input returns HTTP 400. Missing key and Gemini failures return a clear non-2xx error response.
