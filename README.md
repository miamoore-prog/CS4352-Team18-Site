# AI Tools Browser (example)

This is a small Next.js example project that provides a minimal interface to search and browse AI tools. It's designed for non-technical users: clear, minimal, and focused.

What I added:
- Next.js app skeleton (app router)
- Tailwind CSS config and global styles
- Hard-coded data in `data/tools.json` with realistic tool entries
- Landing page with search bar
- Tools listing page with filter sidebar, cards, and modal with a how-to guide

How to run (macOS / fish shell):

```fish
npm install
npm run dev
```

Open http://localhost:3000

Notes:
- Styling is Tailwind-based with a shadcn-inspired palette and simple components.
- Data is hard-coded in `data/tools.json`. You can extend it with more fields.
- This is a focused prototype; if you want, I can wire it to a small backend or add persistence, accessibility improvements, or richer search (fuzzy matching).
