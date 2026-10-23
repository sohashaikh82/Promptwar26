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

## Complaint analysis endpoint

`POST /api/analyze-complaint`

Request JSON: `{ "description": "..." }` (8–1200 characters).

Success returns `category`, `severity`, `priorityScore` (0–100), `responsibleDepartment`, `explanation`, and `recommendedAction`. Invalid input returns HTTP 400. Missing key and Gemini failures return a clear non-2xx error response.
