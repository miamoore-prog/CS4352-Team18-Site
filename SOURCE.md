# Design Docs

This is a small Next.js 13 app (App Router) that uses React + Tailwind and stores data as JSON files for local development.

Quick facts

- Auth: mock, file-backed. Users are in `database/users/*.json`. Login returns a small token and `mock_auth` is saved in localStorage. Requests include `x-user-id` so server routes can identify the caller and enforce admin actions.
- Semantic search: deterministic-first. Server tries local keyword matching and only calls the external Gemini/GenAI model (when `GEMINI_API_KEY` is set) for ambiguous queries; model responses are parsed and sanitized as JSON.
- Storage: mock DB in `database/` and `data/` (tools, users, tool-requests, reviews). Uploads are saved to `public/uploads`.

Technologies & purpose

- Next.js 13 (App Router): app framework, server routes (`app/api/*`) and server/client components.
- React 18: UI and client interactivity.
- Tailwind CSS: styling utility classes used across components.
- Node.js: runtime for Next.js server.
- Gemini / GenAI (optional): semantic search and intent classification when configured via `GEMINI_API_KEY`.
- Local JSON files: quick, human-readable mock data store for development.

Where to look

- Auth helpers: `lib/mockAuth.js`, login route: `app/api/auth/login/route.js`, login page: `app/login/page.js`
- Semantic search: `app/api/gemini/route.js` and `scripts/testGemini.mjs`
- Community & moderation: `app/api/community/route.js` and UI in `app/community`
- Tools data: `database/tools/` and UI components in `components/`
