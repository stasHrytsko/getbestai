# GetBestAI

Find the best AI model for your task. Pick what you need (translation, writing, Q&A, code, creative work or analysis), rank what matters to you (quality, speed, price), and get a shortlist of models that fit.

Model data comes from the [Artificial Analysis](https://artificialanalysis.ai) API.

## How it was built

Before building the comparison on top of the API, `analyze-api.js` audits the data: it pulls every model and reports which fields are actually populated, so the ranking only uses metrics that exist for enough models.

```bash
ARTIFICIAL_ANALYSIS_API_KEY=your_key node analyze-api.js
```

## Stack

React 18, Vite, dnd-kit for drag-to-rank priorities, lucide-react icons. Installable PWA with a service worker. `api/models.js` is a serverless function that proxies the Artificial Analysis API so the key stays on the server.

## Run locally

```bash
npm install
npm run dev
```

Production build: `npm run build`.
