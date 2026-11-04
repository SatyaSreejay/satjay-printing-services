# Print shop website

Website for a small printing business: services catalog (no prices), a design
studio with print-accurate layout templates, an order form that turns into an
emailed ticket, customer tracking links, a password-protected admin, and an AI
design assistant that is built but switched off.

Languages: English (default), Telugu and Hindi. Light and dark themes.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD at least
npm run dev                  # http://localhost:3000
```

With no email settings, order emails are saved to `.data/outbox/` so you can
open them in a browser. Uploaded files and tickets go to `.data/`.

## Before going live

See **[docs/SETUP.md](docs/SETUP.md)** for every placeholder and credential, in order.

## Pages

| Path | What it is |
|---|---|
| `/` | Home |
| `/services` | Services with design styles and material options |
| `/studio` | Design studio: pick a layout, type real text, preview at print size |
| `/assistant` | AI design assistant ("coming soon" until enabled) |
| `/order` | Order form with file uploads (up to 50 MB total) |
| `/track`, `/t/<token>` | Order tracking |
| `/admin` | Shop admin (password protected) |

## Code map

| Where | What |
|---|---|
| `src/config/business.ts` | Shop name, phone, WhatsApp, email, address, hours (placeholders) |
| `src/lib/catalog.ts` | Services and their options (labels live in `messages/*.json`) |
| `src/lib/templates/` | Print templates, drawn as SVG in millimetres |
| `src/lib/server/storage/` | Storage adapter: local folder or S3-compatible bucket |
| `src/lib/server/notify/` | Notifier interface: email and WhatsApp Cloud API |
| `src/lib/ai/imageProvider.ts` | Image provider adapter (text-free artwork) |
| `src/lib/ai/designAssistant.ts` | Claude design assistant |
| `messages/en.json`, `te.json`, `hi.json` | All site text |

## Scripts

- `npm run dev`, `npm run build`, `npm start`
- `npm run typecheck`, `npm run lint`
- `npm run i18n:check`: every key exists in Telugu and Hindi with the same placeholders
- `npm run i18n:review`: regenerate `docs/TRANSLATIONS_REVIEW.md` for a native-speaker review
