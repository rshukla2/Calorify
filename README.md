# Calorify

A mobile-first calorie and macro tracker built with React, TypeScript, Vite and Tailwind CSS.

**Live demo:** https://rshukla2.github.io/Calorify/

## Features

- **Onboarding & goals:** calculates BMR, maintenance calories and daily calorie/macro targets from your stats, activity level and goal (metric or imperial).
- **Food logging:** log meals by type, edit or delete entries, and track daily calories, protein, carbs and fat.
- **History:** browse previous days and see your progress over time.
- **GLP-1 companion:** optional medication schedule, dose history, symptom logging with safety tiers, and meal timing/appetite context.
- **AI features (needs the backend):** natural-language food estimates, meal-photo analysis, and an AI nutrition coach, powered by Google Gemini through a small Express server.
- **Private by design:** all data stays in your browser's `localStorage`. There is no account and no cloud sync.

> The GitHub Pages demo is a static build, so the AI features are turned off there and show a notice. Manual logging, goals, history and the GLP-1 tools all work. To try the AI features, run the app locally with a Gemini API key.

## Tech stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Express · Google Gen AI SDK · Vitest + Testing Library · Playwright

## Run locally

Prerequisite: Node.js 22+

```bash
npm install
GEMINI_API_KEY=your_key_here npm run dev   # http://localhost:3000 (the key is optional; it enables AI features)
```

## Tests

```bash
npm run lint        # TypeScript type-check
npm test            # unit + component tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright)
```

## Deployment

Every push to `main` builds the frontend and deploys it to GitHub Pages through GitHub Actions (`.github/workflows/deploy.yml`).
