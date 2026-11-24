# Urban Air Quality Assistant

**Challenge 6: Urban Air Quality Assistant (PromptWars).** A GenAI assistant that helps families navigate severe winter smog with location-aware routines, indoor air hacks and sustainable alternatives, and explains the direct impact of each choice.

## Approach and logic
1. The user enters a city and household context (children, older adults, respiratory conditions, commute, cooking fuel, purifier).
2. The server geocodes the place and fetches live **US AQI and PM2.5** from Open-Meteo (no API key).
3. A **deterministic rules engine** (`src/lib/aqi.ts`) maps AQI to EPA bands, shifts the band up for sensitive households, and produces actions, each with a `why` explaining its impact.
4. **Gemini** turns those facts into a short plain-language summary. It only sees server-built facts, never raw user text, so prompt injection has no entry point. If the key is missing or the call fails, the rules engine writes the summary and the app still works.

## Quality attributes
- **Code quality:** small single-purpose modules, strict TypeScript, pure functions separated from I/O.
- **Security:** strict input validation (allow-list regex and enums), 2 KB body cap, per-IP rate limit, upstream timeouts, API key in a header and server-only, CSP and other security headers, no user data stored.
- **Efficiency:** upstream responses cached (AQI 10 min, geocoding 24 h), one round trip per request, bounded memory.
- **Testing:** `npm test` runs Vitest unit tests for the rules engine, validation and rate limiter.
- **Accessibility:** semantic landmarks, labelled controls, skip link, focus moved to results, `aria-live` updates, AQI conveyed in text not colour alone, dark mode, reduced motion, 44px targets.

## Run and deploy
```bash
npm install && cp .env.example .env.local   # add GEMINI_API_KEY (optional)
npm test && npm run dev
```
Deploy: import the repo into Vercel and set `GEMINI_API_KEY` in Project Settings.

## Assumptions
- US AQI scale is used worldwide for consistency; local indices may differ.
- Guidance is general health information, not medical advice.
- The in-memory rate limiter is per serverless instance; use Redis/Upstash at scale.
