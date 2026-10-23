# CivicSense AI

## Run locally

Copy `.env.example` to `.env` and add your Google AI Studio key as `GEMINI_API_KEY`. Keep `.env` private.

Run these in separate PowerShell terminals:

```powershell
npm run server
npm run dev
```

Open the Vite URL shown in the terminal. Gemini analysis requires a valid API key.

## Deploy

Deploy this repository to Render using `render.yaml`, then set `GEMINI_API_KEY` in the service's environment settings. Never commit `.env` or expose the key in frontend code.
