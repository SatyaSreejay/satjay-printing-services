# Setup checklist

Everything the site needs before it goes live. Secrets go in the hosting
provider's environment variables (or `.env.local` for local runs), never in git.
`.env.example` lists every variable.

## 1. Business details (placeholders)

Edit `src/config/business.ts`:

- `name`, `tagline`
- `phoneDisplay`, `phoneE164`
- `whatsappNumber` (digits with country code, no `+`, e.g. `919876543210`); used by the "Chat on WhatsApp" button
- `email`, `addressLines`, `hours`, `mapUrl`
- `ticketPrefix` (ticket numbers look like `SPS-261104-7K3Q`)

## 2. Secrets every deployment needs

| Variable | What to put |
|---|---|
| `SITE_URL` | The public address, e.g. `https://www.yourshop.in` (used in email links) |
| `APP_SECRET` | A long random string: `openssl rand -base64 32`. Signs tracking and download links. Changing it breaks old links. |
| `ADMIN_PASSWORD` | Password for `/admin` (8+ characters). Admin is off when empty. |

## 3. Order emails (SMTP)

New orders are emailed to the shop as a ticket, and the customer gets a
confirmation if they gave an email.

**Gmail** (simplest):
1. On the Gmail account that will send mail, turn on 2-Step Verification.
2. Google Account → Security → App passwords → create one for "Mail".
3. Set:
   - `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`
   - `SMTP_USER=` that Gmail address, `SMTP_PASS=` the 16-character app password
   - `SHOP_NOTIFY_EMAIL=` the address where tickets should arrive (placeholder until you send it)

Any other mail provider works with its SMTP host, port, user and password.
Gmail allows about 500 emails a day, plenty for a small shop.

## 4. File storage

Customers upload straight from the browser to storage with short-lived signed
URLs, so files never pass through the web server (no host body-size limits).
Tickets are stored as small JSON files in the same bucket.

- **Local / single server:** `STORAGE_DRIVER=local` keeps everything in `.data/`. Fine for development or a VPS with a persistent disk. **Not for Vercel/serverless**, whose disk is wiped.
- **Production (recommended): Cloudflare R2** (10 GB free, no download fees). Any S3-compatible bucket works.
  1. Create a private bucket.
  2. Create an API token with Object Read & Write on that bucket.
  3. Set `STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_REGION=auto`, `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
  4. Add a CORS rule on the bucket so browsers can upload:
     ```json
     [{ "AllowedOrigins": ["https://www.yourshop.in"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
     ```

Limits: 50 MB total per order, up to 20 files (`uploadLimits` in `src/config/business.ts`).
Over the limit, customers are told to send files by WhatsApp or email.
Download links in emails work for 180 days.

## 5. WhatsApp alerts (optional, later)

The shop gets a WhatsApp message for each new ticket through the WhatsApp
Business Cloud API. Until the keys are set, this channel is skipped and logged.

1. In Meta for Developers, create an app with the WhatsApp product and add a business phone number.
2. Create a permanent access token (System User in Business Manager).
3. Create and get approval for a message template with 4 body variables, for example:
   `New order {{1}} from {{2}} for {{3}}. Open: {{4}}`
4. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_NOTIFY_TO` (shop owner's number, digits with country code), `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`.

Without a template name the site sends plain text, which WhatsApp only
delivers if the owner messaged the business number in the last 24 hours.

## 6. AI features (switched off)

Nothing calls an AI API until these are set.

- **Design assistant (Claude):** `AI_ASSISTANT_ENABLED=true` and `ANTHROPIC_API_KEY` from console.anthropic.com (needs billing). Uses Claude Opus 5.5 by default (`AI_CHAT_MODEL`).
- **Text-free artwork (Gemini):** `AI_IMAGE_PROVIDER=gemini` and `GEMINI_API_KEY` from Google AI Studio. The Gemini adapter hasn't been run against the live API yet; test it before relying on it.
- **Limits:** `AI_CHAT_PER_IP_HOUR`, `AI_CHAT_PER_IP_DAY`, `AI_CHAT_DAILY_TOTAL`, `AI_IMAGE_PER_IP_DAY`, `AI_IMAGE_DAILY_TOTAL`.

Rate limits are kept in memory. On serverless hosting each instance counts
separately, so the real ceiling is a little higher; swap in a shared store
(`RateLimitStore` in `src/lib/server/rateLimit.ts`) if that matters.

## 7. Translations

Telugu and Hindi were machine-drafted. Ask a native speaker to go through
`docs/TRANSLATIONS_REVIEW.md`, then edit `messages/te.json` / `messages/hi.json`
and run `npm run i18n:check`.

The admin pages are English only.

## 8. Hosting

Hosting is not decided yet. Any Node.js host works (Vercel, Render, Railway,
a VPS). On Vercel or another serverless host, use S3/R2 storage (section 4).
