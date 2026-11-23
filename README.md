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

> The GitHub Pages demo is a static build that runs in **demo mode** (`VITE_DEMO_MODE=true`). There, the AI features return realistic sample responses instead of calling Gemini, and a "Demo mode" badge says so. Nothing is sent anywhere. Run the app locally with a Gemini API key for live AI.

## Tech stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Express · Google Gen AI SDK · Vitest + Testing Library · Playwright

## Run locally

Prerequisite: Node.js 22+

```bash
npm install
GEMINI_API_KEY=your_key_here npm run dev   # http://localhost:3000 (the key is optional; it enables AI features)
```

### AI usage limits

The Express server protects the Gemini API key with in-memory rate limits on all `/api/ai/*` routes. You can change them with environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `AI_RATE_PER_MINUTE` | 5 | requests per minute per IP |
| `AI_RATE_PER_DAY` | 30 | requests per day per IP |
| `AI_GLOBAL_PER_DAY` | 150 | requests per day across all users |

The AI coach is limited to nutrition, fitness and app questions. It declines off-topic requests such as coding, homework or general chat, and it ignores attempts to override its instructions. Chat messages are capped at 500 characters, with the last 10 history turns kept.

## Tests

```bash
npm run lint        # TypeScript type-check
npm test            # unit + component tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright)
```

## Deployment

Every push to `main` builds the frontend and deploys it to GitHub Pages through GitHub Actions (`.github/workflows/deploy.yml`).
