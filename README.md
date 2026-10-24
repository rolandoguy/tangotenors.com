# Tango Tenors

Official Tango Tenors website, published with Cloudflare Pages from the `main` branch.

## Local preview

Open `index.html` directly, or serve this folder with any static web server. The English homepage is at `/en/`.

## Concert updates

Add and update confirmed Tango Tenors concerts only in `assets/events.js`; do not add dates for separate projects. The German and English homepages and press kit read the same list. `assets/concert-calendar.js` classifies each event at runtime in `Europe/Berlin`, sorts upcoming dates nearest-first and the archive newest-first, and updates the visible lists and MusicGroup event data when an event ends, when the page regains focus, or at least once a minute. No deployment is needed for the date transition itself.

Each event needs an ISO `date` (`YYYY-MM-DD`). Add `startDate` only when its start time is confirmed, with an explicit UTC offset (for example `2026-12-06T20:00:00+01:00`), and `endDate` when a confirmed finish time is available. When a timed event has no `endDate`, its length defaults to `defaultDurationMinutes` in `TANGO_EVENT_SETTINGS` (currently 120 minutes); a per-event `durationMinutes` can override it. Date-only events are kept upcoming for that entire Berlin calendar day and archived on the following Berlin day, without inventing a historical time. The explicit-offset instant comparison handles summer/winter clock changes and is independent of the visitor's device time zone. Give every event a unique stable `id`; duplicate IDs resolve to the last record.

Run the calendar checks with `node --test tests/concert-calendar.test.js` (also with different `TZ` values to check device-time-zone independence).

## Deployment

Pushing to GitHub `main` triggers the connected Cloudflare Pages deployment.
