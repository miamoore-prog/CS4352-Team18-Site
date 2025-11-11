# AI Compass — Local Development & Testing

This repository is a small Next.js 13 application (App Router) used to browse, review and discuss AI tools. It includes:

- a tools catalog (JSON-backed under `database/tools/`)
- a community forum where users can create posts and comment
- a lightweight mock authentication system for local testing
- admin features for moderating content and managing tool records

This README explains the core functionality, how to run the app locally, and how to test both user and admin roles.

## Features (at-a-glance)

1. User capabilities

- Search for tools using natural language (server-side assist via the Gemini/GenAI route)
- Search for community posts using natural language
- Bookmark tools
- View tool details
- Review tools (create reviews/posts attached to a tool)
- Create community posts
- Comment on other people's posts
- Submit requests to add a new tool to the catalog
- Browse articles

2. Admin capabilities

- All user capabilities above
- Manage incoming tool requests (view, comment, close)
- Add, edit or hide/remove tools from the catalog
- Moderate community content: flag posts, delete posts, delete comments

Notes on roles: the project uses a mock auth system during local development. Test users are stored in `database/users/*.json`, including a pre-created admin account at `database/users/admin.json`.

## Prerequisites

- Node.js (>=16 recommended)
- npm (or a compatible package manager)
- macOS (instructions include fish-shell examples)

If you plan to use the external Gemini/GenAI integration (optional), you'll need an API key. See the Environment section below.

## Install & run (local development)

1. Clone the repo and change to the project directory (if you haven't already):

```fish
cd /path/to/CS4352-Team18-Site
```

2. Install dependencies:

```fish
# using npm
npm install
```

3. Create environment variables (optional — required only if you want the Gemini model features)

Create a `.env.local` in the project root with the following (do NOT commit this file):

```text
GEMINI_API_KEY=your_real_gemini_api_key_here
```

4. Start the dev server:

```fish
npm run dev
```

Open http://localhost:3000 in your browser.

## Authentication — mock users

The app provides a simple mock login for local testing. Example test users exist under `database/users/`.

- Admin account (example):
  - username: `admin`
  - password: `adminpass`
  - file: `database/users/admin.json`

Other sample users are available as `user1.json`, `user2.json`, etc.

To log in:

1. Visit `/login` in the app.
2. Use one of the usernames above and its password. The login flow stores a `mock_auth` object in `localStorage` that contains the token and user metadata used by the UI.

## How to test user vs admin flows

- User flow

  - Log in as a standard user (e.g., `user1` / `test` if provided). If no password is known, the login UI provides sample credentials.
  - Use the search box on the home page to search tools or posts in natural language.
  - Open a tool card to view detail, bookmark it, and create a review.
  - Visit the Community page to create a post and comment on posts.
  - Submit a tool request via the Tools -> Request flow.

- Admin flow
  - Log in as the admin account (`admin` / `adminpass`).
  - Visit the admin areas (Manage → Tools or Tools → Requests) to see and handle tool requests.
  - From the Community page you will see flagged posts and admin controls to Flag/Unflag, Delete comments or Delete threads.
  - Admins may add or edit tools via the admin UI which writes tool JSON under `database/tools/`.

## Data layout (for maintainers)

- `database/tools/` — canonical tool JSON files (one file per tool)
- `database/users/` — user objects; community threads are stored in each user's JSON under a `threads` property
- `data/reviews-store.json` and `data/tool-requests.json` — auxiliary stores for reviews and tool requests

If you plan to modify the schema, update `app/api/gemini/route.js` and the UI components that consume the data (see `components/ToolCard.js`, `components/ToolModal.js`).

## Environment & external services

- GEMINI_API_KEY — optional. If present the server routes that call Gemini/GenAI will use it to provide natural-language search and recommendations. Keep this secret.

Important: do not commit `.env.local` or your keys to source control.

## Developer notes & testing helpers

- Deterministic-first model behavior: server endpoints attempt local deterministic classification/filtering before calling the external model for speed and predictable tests. See `app/api/gemini/route.js` for details.
- Mock auth: server-side endpoints look for an `x-user-id` HTTP header to understand who is making a request (the client automatically sets this from the `mock_auth` token).
- To run the small Gemini test script (if you configured the key):

```fish
node scripts/testGemini.mjs
```

## Troubleshooting

- If the dev server fails to pick up environment changes, stop and restart `npm run dev`.
- If the UI doesn't show admin controls after logging in, check that `localStorage.mock_auth` contains a `user` object with `role: "admin"` (the login page stores this for you when you sign in).

## Contributing & extending

- Follow the app's data-first UI conventions: if you change the tool schema, update `database/tools.json` and UI components (`ToolCard`, `ToolModal`) accordingly.
- Server-side model code must preserve the deterministic-first + JSON-sanitization behavior used in `app/api/gemini/route.js`.

## License & acknowledgements

This repository is intended for educational and prototyping use. Replace third-party API keys and any proprietary data with your own when deploying or sharing.
