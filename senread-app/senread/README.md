# SenRead — Frontend Scaffold

A React + Vite + Tailwind starting point for the SenRead reading platform,
built from the approved visual design. Real, running code — not a mockup.

## Run it

```
npm install
npm run dev
```

Open the printed localhost URL. The app is mobile-first: resize your
browser narrow, or open dev tools device mode, to see it as intended.
On wide screens it stays centered at phone width by design (matches the
brief's "mobile-first, installable" direction) — this is where a future
desktop-specific layout pass would branch off.

## Structure

```
src/
  components/
    ui/        Small stateless primitives (IconButton, Tag, ProgressBar, Ring, icons)
    book/      BookCard, ContinueReadingCard
    reader/    BilingualSentence (the signature component), AudioBar
    layout/    AppShell (route outlet + bottom tab bar), TabBar
  pages/       One file per route: Home, Discover, BookDetail, Reader, Library, Profile
  lib/api.js   Every page reads data through here. Swap these functions for
               real fetch() calls when the backend exists — no component
               needs to change.
  data/        Mock books/chapters/library data, shaped like a future API response.
  index.css    Design tokens (colors, fonts) as a Tailwind v4 @theme block.
```

## Design tokens

Defined once in `src/index.css`, used everywhere via Tailwind classes
(`bg-paper`, `text-gold`, `font-display`, etc.):

| Token | Value | Use |
|---|---|---|
| `paper` | `#F7F4EC` | App background |
| `ink` | `#211E19` | Primary text |
| `deep` / `deep-2` | `#122A28` / `#0D211F` | Dark surfaces, reader background, CTAs |
| `gold` / `gold-soft` | `#B08A4E` / `#D8BD8B` | Accent, progress, active states |
| `taupe` | `#8B8172` | Secondary text |
| `surface` / `surface-line` | `#EFEAE0` / `#E1DACB` | Cards, tags, dividers |

Fonts: **Fraunces** (display/serif, book titles), **Newsreader** (reading
serif, story prose), **Inter** (UI text).

## What's real vs. stubbed

- **Real:** routing, component structure, responsive layout, all styling,
  the bilingual reader interaction (tap a word to highlight — a stand-in
  for the future dictionary popup).
- **Stubbed:** `lib/api.js` returns local mock data instead of calling a
  server. No auth, no persistence, no audio playback, no payments —
  those need the backend/architecture pass before they can be real.

## Suggested next steps

1. Wire `lib/api.js` to a real backend once the data model is settled.
2. Add the word-tap dictionary popup (definition, pronunciation, save to
   vocabulary) inside `BilingualSentence`.
3. Add reading-preferences state (font size, theme, width) with context,
   consumed by the Reader page.
4. PWA: add a manifest + service worker via `vite-plugin-pwa`.
5. Admin dashboard is a separate app surface — not part of this reader-facing scaffold.
