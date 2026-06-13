# Headroom UI

A local, phone-friendly web UI for the Headroom CLI.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. The UI and API bind to localhost by default because the API can run local Headroom commands.

The app starts a Vite frontend and a local Express API. The API only accepts validated top-level `headroom` commands and can manage a local proxy process from the Proxy page.

## Verify

```bash
npm run build
npm run lint
npm run test
npm audit --audit-level=moderate
```
