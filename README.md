# Submarine

Small vanilla JavaScript prototype for a 2D top-down educational exploration game set in the California Bay Area.

## Run

The easiest option is to open `index.html` directly in a browser.

### Easiest

- Open the repo folder
- Double-click `index.html`
- Or right-click `index.html` and open it in Chrome, Edge, or another browser

### Optional: npm

You can still use `npm start` from the project root to launch a small local static server.

```bash
npm start
```

Then open the local URL shown in the terminal, usually `http://localhost:3000`.

### macOS / Linux

```bash
cd /path/to/Submarine
npm start
```

### Windows

```powershell
cd C:\path\to\Submarine
npm start
```

On the first run, `npx` may ask permission to download `serve`. Accept with `y`.

You can still open `index.html` directly in a browser, or serve the folder with any static server.

## Files

- `src/player.js`: submarine movement logic
- `src/data/fishData.js`: editable fish quiz data
- `src/game.js`: rendering, interaction, modal quiz flow
- `styles.css`: marine-themed UI styling
