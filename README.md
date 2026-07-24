# Noor — Holy Quran (black & gold edition)

An original, independently-built Quran reading web app: browse all 114 surahs,
read Arabic text with translation, listen to ayah-by-ayah recitation, and save
bookmarks. Styled in black and antique gold, with an illuminated-manuscript
feel (Amiri Arabic type, gold ornamental dividers).

This project is **not** a copy of any Play Store listing — it's built from
scratch on top of the free, public [AlQuran Cloud API](https://alquran.cloud/api),
so the Arabic text, translations, and audio are legitimate open data, not
copied assets or code.

## Folder structure

```
holy-quran-app/
├── index.html          # App shell: header, screens, bottom nav, mini player
├── css/
│   └── style.css        # Black/gold design tokens + all styling
├── js/
│   ├── api.js            # Fetches surah list, ayah text, audio URLs
│   ├── player.js          # Sequential ayah audio playback + mini player
│   └── app.js               # Navigation, rendering, search, bookmarks, settings
├── assets/               # (empty — reserved for any custom icons/images you add)
└── README.md
```

## Running it

No build step or install required — it's plain HTML/CSS/JS. Because it
fetches data from a remote API, open it through a local server rather than
double-clicking the file (some browsers block `fetch` on `file://` pages):

**Option A — Python (usually pre-installed):**
```bash
cd holy-quran-app
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

**Option B — Node:**
```bash
npx serve holy-quran-app
```

**Option C — VS Code:** install the "Live Server" extension and click
"Go Live" with `index.html` open.

## Features

- **Surah list** — all 114 chapters with Arabic + English names, verse
  counts, and Meccan/Medinan tag. Live search by name or number.
- **Reader** — Arabic (Uthmani script) with your chosen translation,
  bismillah header, per-ayah play and bookmark buttons.
- **Audio** — tap any ayah to start recitation from that point; a mini
  player lets you play/pause and skip within the surah. Choose from four
  reciters in Settings.
- **Bookmarks** — saved locally in the browser; tap a saved ayah to jump
  back to it.
- **Settings** — switch translation (English, Urdu, French, Indonesian
  editions included), reciter, toggle translation visibility, and adjust
  Arabic text size.
- **Continue reading** — the home screen remembers the last surah you
  opened.

## Customizing

- **Colors / type** — all design tokens are declared as CSS variables at
  the top of `css/style.css` (`--ink`, `--gold`, `--gold-bright`,
  `--font-arabic`, etc.) — change them there to retheme the whole app.
- **Translations / reciters** — add more `<option>`s in the Settings
  screen in `index.html`; any edition identifier from
  `https://api.alquran.cloud/v1/edition` will work.
- **App icon / name** — this build ships without a name/logo tied to any
  existing product, so you're free to add your own branding in
  `assets/` and update the `<title>` and `.brand` markup in `index.html`.

## Data & audio sources

- Text & translations: `api.alquran.cloud`
- Audio recitations: `cdn.islamic.network` (same open project)

Both are free, keyless, and commonly used in open-source Quran apps.
