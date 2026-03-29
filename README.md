# Submarine Fish Quest

This project is a browser game made with plain HTML, CSS, and JavaScript.

You do not need to install packages to run it. The main file is `index.html`.

## Files

- `index.html`: the page that starts the game
- `style.css`: the game styling
- `data.js`: fish data and game configuration
- `game.js`: gameplay logic

## Quick Start

If you just want to open the game as fast as possible:

1. Open the project folder.
2. Find `index.html`.
3. Open `index.html` in a web browser.

If that works, you are done.

## Open The Game On Mac

### Option 1: Open `index.html` directly

This is the easiest option.

1. Open `Finder`.
2. Go to the `Submarine` project folder.
3. Find `index.html`.
4. Double-click `index.html`.

If your Mac does not open it in the browser you want:

1. Right-click `index.html`.
2. Click `Open With`.
3. Choose `Google Chrome`, `Safari`, or `Firefox`.

### Option 2: Drag the file into a browser

1. Open your browser first.
2. Open `Finder` and locate `index.html`.
3. Drag `index.html` into the browser window.

### Option 3: Open it from Terminal

If you are already inside the project folder in Terminal, run:

```bash
open index.html
```

If you want to open it in a specific browser:

```bash
open -a "Google Chrome" index.html
```

or

```bash
open -a Safari index.html
```

## Open The Game On Windows

### Option 1: Open `index.html` directly

This is the easiest option.

1. Open `File Explorer`.
2. Go to the `Submarine` project folder.
3. Find `index.html`.
4. Double-click `index.html`.

If Windows opens it in the wrong app:

1. Right-click `index.html`.
2. Click `Open with`.
3. Choose a browser like `Chrome`, `Edge`, or `Firefox`.

### Option 2: Drag the file into a browser

1. Open your browser.
2. Open `File Explorer`.
3. Drag `index.html` into the browser window.

### Option 3: Open it from Command Prompt

If you are already inside the project folder in Command Prompt, run:

```bat
start index.html
```

If you are using PowerShell, you can also run:

```powershell
ii .\index.html
```

## Better Option: Run A Simple Local Server

Opening `index.html` directly usually works for this kind of project, but using a local server is often more reliable.

Use a local server if:

- images or browser features behave strangely
- you want a setup that is closer to how web projects are normally run
- you want easier refreshing while testing changes

## Run A Local Server On Mac

### Using Python

Most Macs already have Python available.

1. Open `Terminal`.
2. Change into the project folder.
3. Run:

```bash
python3 -m http.server 8000
```

4. Open your browser.
5. Go to:

```text
http://localhost:8000
```

6. Click `index.html` if it does not open automatically.

To stop the server:

1. Go back to Terminal.
2. Press `Control + C`.

## Run A Local Server On Windows

### Using Python

If Python is installed:

1. Open `Command Prompt` or `PowerShell`.
2. Change into the project folder.
3. Run:

```bat
python -m http.server 8000
```

If that does not work, try:

```bat
py -m http.server 8000
```

4. Open your browser.
5. Go to:

```text
http://localhost:8000
```

6. Click `index.html` if needed.

To stop the server:

1. Go back to the terminal window.
2. Press `Ctrl + C`.

## VS Code Option On Mac Or Windows

If you use Visual Studio Code, this is another easy way to run the game.

1. Open the project folder in VS Code.
2. Install the `Live Server` extension.
3. Right-click `index.html`.
4. Click `Open with Live Server`.

That will open the game in your browser with a local server.

## Controls

- Move: `Arrow Keys` or `WASD`
- Interact: `E`, `F`, or click a nearby signal

## If The Game Does Not Open

Try these checks:

1. Make sure you opened `index.html`, not `data.js` or `game.js`.
2. Make sure all four project files stay in the same folder:
   `index.html`, `style.css`, `data.js`, and `game.js`.
3. Try a different browser.
4. Try the local server method instead of double-clicking the file.
5. Refresh the page after making changes.

## If You Change The Code

After editing the game:

1. Save your files.
2. Refresh the browser tab.

If you opened the file directly, a normal refresh is enough.
If you are using a local server, refresh the same browser tab at `localhost`.
