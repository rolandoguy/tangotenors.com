# Tango Tenors

Official Tango Tenors website, published with Cloudflare Pages from the `main` branch.

## Local preview

Open `index.html` directly, or serve this folder with any static web server. The English homepage is at `/en/`.

## Concert updates

Add and update confirmed concerts in `assets/events.js`. The German and English homepages use this shared event list for their upcoming-concert CTA, concert archive, and Event structured data. Set `ticketUrl` only when the ticket page is verified; otherwise the CTA links to the concert details. The homepage selects events using the Europe/Berlin calendar date and returns to the evergreen hero when no future event dates remain.

## Deployment

Pushing to GitHub `main` triggers the connected Cloudflare Pages deployment.
