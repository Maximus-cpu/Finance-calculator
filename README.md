# Finance Monitor

A fully client-side finance dashboard to monitor bank accounts and virtual wallets.
No backend or build step required — just open `index.html` in a browser.

## Features

- **Dashboard** — total balance, net flow, account cards, balance trend chart
- **Transactions** — log income & expenses manually, linked to any account
- **Filters** — filter by type, account, category, or free-text search
- **Budget limits & alerts** — set monthly limits per category with visual warnings
- **Currency conversion** — toggle between ARS and USD (rate configurable in `app.js`)
- **Export CSV** — download all transactions with ARS and USD amounts

## Getting started

### Option 1 — Open directly
Just double-click `index.html`. No server needed for basic use.

### Option 2 — Local dev server (recommended)
```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```
Then open http://localhost:8080

### Option 3 — GitHub Pages
1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Your app will be live at `https://<your-username>.github.io/<repo-name>/`

## Customisation

### Change the USD exchange rate
In `app.js`, find:
```js
let usdRate = 1200;
```
Update to your preferred rate.

### Add default accounts or transactions
Edit the `accounts` and `transactions` arrays at the top of `app.js`.

## File structure

```
finance-monitor/
├── index.html   — markup & structure
├── style.css    — all styles (light + dark mode)
├── app.js       — all logic, state, and rendering
└── README.md    — this file
```

## Notes

- All data is in-memory. Refreshing the page resets to the default sample data.
- To persist data across sessions, you can extend `app.js` to use `localStorage`.
