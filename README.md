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

## Environment & external services

- GEMINI_API_KEY — optional. If present the server routes that call Gemini/GenAI will use it to provide natural-language search and recommendations. Keep this secret.

Important: do not commit `.env.local` or your keys to source control.
