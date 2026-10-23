# CivicSense AI

CivicSense AI is a civic-issue reporting prototype. It helps residents describe a local issue and gives reviewers a structured, AI-generated starting point for triage. The recommendation is advisory; it does not verify, submit to, or assign work to a government department.

## Features

- Responsive dashboard with complaint counts, search, status filters, and status controls.
- Complaint analysis using Gemini structured output: short summary, category, severity, 0–100 priority score, department recommendation, explanation, next action, missing details, and safety notes.
- Sample complaint to demonstrate the analysis flow.
- Explicit loading, validation, missing-key, and provider-error states.

## Stack and layout

- React 19 and Vite frontend
- Node.js, Express 5 backend
- Google Gemini API called only by the backend

```text
src/                 React application and styles
server/index.js      Express API and production static hosting
public/              Public app assets
render.yaml          Render Blueprint deployment
```

The browser sends the complaint to Express at `POST /api/analyze-complaint`. The server validates the input, calls Gemini, validates the structured response, and returns it. The API key is read from the server environment and must never be added to frontend code.

## Run locally on Windows

From this folder, install dependencies if needed:

```powershell
npm install
Copy-Item .env.example .env
notepad .env
```

Set `GEMINI_API_KEY` in `.env` to a Google AI Studio API key, save the file, then run the backend and frontend in separate terminals:

```powershell
npm run server
```

```powershell
npm run dev
```

Open the Vite URL shown in the second terminal. The Vite development server proxies `/api` to Express on port 3001. Restart the backend after changing `.env`. Without a key, analysis intentionally returns a setup error; it does not show fabricated AI results.

## API

`POST /api/analyze-complaint`

```json
{
  "description": "An electrical wire is sparking near a school entrance.",
  "location": "School entrance, Sector 4"
}
```

Description is required (8–1200 characters); location is optional (up to 180 characters). A successful response includes `summary`, `category`, `severity`, `priorityScore`, `responsibleDepartment`, `explanation`, `recommendedAction`, `missingInformation`, and `safetyWarnings`. `GET /api/health` provides a basic service health check. Invalid input returns HTTP 400; missing Gemini configuration returns HTTP 503; provider or invalid-model responses return a non-success error.

## Verify

```powershell
npm run build
npm run lint
```

There is no automated test suite configured. The dashboard's sample complaints and submitted complaints are held in client-side React state for the current page session; there is no database or permanent complaint storage.

## Deploy to Render

Push the repository to GitHub, create a Render service using **New → Blueprint**, and select this repository. Render reads `render.yaml` to build the Vite assets and start Express. Set `GEMINI_API_KEY` as a private environment variable in the Render service settings, then deploy. Do not commit `.env`, credentials, or frontend variables containing secrets.

## Limitations and safe use

- Real AI analysis requires a valid Gemini key, network access, and a successful provider response.
- AI-generated categories, severity, explanations, and safety notes may be wrong; a human must review them.
- Reports are not officially submitted, assigned, or persisted.
- Do not enter unnecessary personal or sensitive information in demo complaints.

## Quick demo

1. Load the sample complaint and run **Analyse with Gemini**.
2. Review the returned summary, severity, department, action, and safety notes.
3. Submit the report and show the dashboard counts and status controls.
