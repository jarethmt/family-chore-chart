# 🐱 Family Chore Chart

A fun, private, **local-first** chore & reward chart for families — designed for kids
who split time between two houses. Big tappable chore cards, a star jar, prizes to
redeem, and a playful themed mascot. Runs as an installable web app (PWA) on phones and
tablets.

**No server. No account. No monthly cost. Your data never leaves your devices.**

## How it works

- **Local-first:** every device holds the full copy of your family's chores and stars,
  stored on-device (IndexedDB). It works fully offline.
- **Peer-to-peer sync:** devices sync directly to each other over encrypted WebRTC
  (CRDT merge, so two houses editing offline never conflict). A public signaling server
  is used *only* for the initial NAT-traversal handshake — it never sees your data, which
  is end-to-end encrypted.
- **Family units:** devices are grouped by a randomly-generated, unguessable family key.
  Only devices paired with your key can see your data. Pairing is done by scanning a QR
  code (or pasting a code) — no email, no login.

## Features

- ☀️ Morning / 🌙 evening chore lists with big kid-friendly cards (text + icon)
- ⭐ Stars, streaks, and a redeemable **prize shop** (kids request → a grown-up approves)
- 🏠 Per-house chores: a chore can be shared or shown only at one house; **points stay
  unified** across houses
- 👧 Multiple kids: pin a tablet to one child, or show a "who's here?" picker
- 🐱 Themes ("worlds") with reacting mascots — **Cats** is the first fully polished one;
  Space / Ocean / Unicorn / Jungle are stubbed in
- ⏰ Configurable daily reset (default 4am) with timezone-safe day math across houses
- 🔒 PIN-gated grown-up area; optional (off-by-default) on-device camera presence-wake

## Privacy

The public repo ships **completely empty** — no names, ages, houses, or chores. All
family details are entered in-app and stored only on your own devices.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # base path defaults to "/"
# For GitHub Pages at https://<user>.github.io/<repo>/ :
VITE_BASE=/family-chore-chart/ npm run build
```

Pushing to `main` auto-deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Tech

Vue 3 + Vite · [Yjs](https://github.com/yjs/yjs) CRDT · y-webrtc · y-indexeddb ·
vite-plugin-pwa · Font Awesome.

## License

MIT
