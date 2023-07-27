# Node.js Express Spotify Authentication Server

## Production hosting

On `render.com`, e.g. https://spotifyauth-37o5.onrender.com

## Setup

### Environment variables

In the `.env` file AND for production as environment variables on `render.com`, 
there needs to be corresponding pairs of `_CLIENT_ID` and `_CLIENT_SECRET` variables
PLUS a referrer

e.g.

```
DEV_CLIENT_ID="9cb0b05161124d58ab3313980489e215"
DEV_CLIENT_SECRET="fedcba9876543210fedcba9876543210"
DEV_REFERRER="https://spotify-dev.soar-corowa.com"

PRODUCTION_CLIENT_ID="9cb0b05161124d58ab3313980489e215"
PRODUCTION_CLIENT_SECRET="fedcba9876543210fedcba9876543210"
PRODUCTION_REFERRER="https://spotify.soar-corowa.com"
```

