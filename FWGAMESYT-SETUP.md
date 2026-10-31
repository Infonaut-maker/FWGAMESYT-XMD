# FWGAMESYT MD — setup notes

This package is the FWGAMESYT-branded build of the supplied bot source. Existing command modules and bot features have been retained; this is a branding/configuration pass, not a rewrite of the command system.

## Required per-user configuration

Each person must pair their own WhatsApp account and use only their own generated session. Configure these values on that person's hosting service (never commit them to Git or share them):

- `SESSION_ID` — personal session ID from the pairing service.
- `OWNER_NUMBER` — the paired WhatsApp number, digits only with country code.
- `OWNER_NAME` — optional display name.
- `BOT_NAME` — defaults to `FWGAMESYT MD`.

The deployment starter now reads `SESSION_ID` and `OWNER_NUMBER` from environment variables and stops if either is missing. No personal session ID or phone number is prefilled in this package.

## Start

```bash
npm ci
SESSION_ID='YOUR_PERSONAL_SESSION_ID' OWNER_NUMBER='YOUR_NUMBER' BOT_NAME='FWGAMESYT MD' npm start
```

On hosting panels, add the variables in the service's Environment/Secrets section instead of putting them in a public file. Keep each user's credentials and session storage isolated.

## Pairing website integration

The existing starter understands the legacy `CODY_AI!KV:<id>` and `CODY_AI!M:<url>` session-ID formats. Keep that format until the pairing API and session resolver are updated together. The current ZIP does not include the pairing service's write/store API, so the website cannot yet be completed from this repository alone.

## Attribution

This package retains upstream dependency and source attribution where applicable. FWGAMESYT is the deployment branding; it does not imply ownership of upstream code.

## FWGAMESYT WhatsApp channels

After a user's WhatsApp session connects, the bot resolves and requests a follow for these two channels:

- https://whatsapp.com/channel/0029Vb8yoKY77qVXx5C8edY1
- https://whatsapp.com/channel/0029Vb9CVSwE50UotxWHEF24

The user's pairing/setup page must clearly disclose this behavior before they pair or download the bot. Channel-follow requests are made using that user's own linked WhatsApp account. WhatsApp/library behavior can vary; the bot logs failures and retries later. It does not bypass WhatsApp's controls or guarantee a follow if WhatsApp rejects the request.
