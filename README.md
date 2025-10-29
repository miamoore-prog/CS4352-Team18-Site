# ai-tools-browser — local setup notes

This project uses the Google GenAI (Gemini) API for server-side recommendations. The server expects the API key to be provided via an environment variable named `GEMINI_API_KEY`.

Local setup steps to enable Gemini (do not commit your secret):

1. Create a `.env.local` file in the project root (next to `package.json`).

	Example `.env.local` (replace with your real key):

	GEMINI_API_KEY=your_real_gemini_api_key_here

2. Start or restart the dev server from the project root so Next.js picks up the env var:

	npm install --legacy-peer-deps   # if you haven't installed deps yet
	npm run dev

3. Quick verification options:

	- Run the included test script (server-side):
		 node scripts/testGemini.mjs

	- Or use the app UI: open the landing page and perform a search — the client calls `/api/gemini` which uses `process.env.GEMINI_API_KEY` on the server.

Security notes
- Do NOT commit `.env.local` or your API key to source control.
- `.env.example` exists in the repo as a template.

If you want, I can add a brief note to the project that reminds contributors to create `.env.local` (I already added this README entry). If you'd like, I can also create a `.env.local.example` or add a pre-start check that warns when `GEMINI_API_KEY` is missing.
