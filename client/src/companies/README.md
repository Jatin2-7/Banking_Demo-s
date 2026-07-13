# Multi-Company Demo Platform

This project hosts **multiple fintech company demos** in a single codebase. Each company gets its own URL, config, and UI folder while sharing journeys (fund transfer, deposits, voice, AGUI).

## Quick start

```bash
npm run dev
```

Open the demo hub: **http://localhost:5173/**

| Company     | URL                              |
|-------------|----------------------------------|
| ABCD           | http://localhost:5173/abcd           |
| Optimo Capital | http://localhost:5173/optimo-capital |
| DCB Bank       | http://localhost:5173/dcb          |
| Indian Bank | http://localhost:5173/indian-bank |

## Folder structure

```
client/src/
├── companies/           # One folder per company
│   ├── abcd/
│   │   ├── config.js       # Brand, agents, platform
│   │   ├── theme.js        # Design tokens
│   │   ├── HomeScreen.jsx  # Company home shell
│   │   ├── AbcdHeader.jsx  # Headers
│   │   ├── loan/           # Loan journey UI
│   │   └── index.js
│   ├── dcb/
│   ├── indian-bank/
│   └── registry.js      # Register new companies here
├── shared/
│   ├── app/             # Shared demo runtime (voice, overlays, AGUI)
│   ├── journeys/        # Journey catalogue (same flows for all)
│   └── lib/             # Company-aware helpers
├── shells/              # Mobile (phone frame) vs web layouts
├── context/             # CompanyProvider + useCompany()
├── pages/               # Demo hub landing page
└── routes/              # Per-company routing
```

## Adding a new company

1. Create `client/src/companies/{slug}/config.js` (copy from `abcd/config.js`).
2. Add the config to `companies/registry.js`.
3. Build UI components in `companies/{slug}/` from screenshots.
4. Open `http://localhost:5173/{slug}`.

**Rule:** `companies/{slug}/` = UI only. `shared/` = functionality.

## Platform types

Set `platform: 'mobile'` or `platform: 'web'` in the company config. The shell switches automatically (`MobileShell` vs `WebShell`).
