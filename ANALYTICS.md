# Tango Tenors analytics

Tango Tenors uses its own Umami Cloud website (`e11b9734-0ce4-437f-9506-48ca1f1b64d3`). The tracker is included once per HTML page. Keep this ID separate from the Rolando Guy website.

## Campaign links

Use lowercase values consistently. Umami captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` from landing-page URLs automatically.

| Channel | `utm_source` | `utm_medium` |
| --- | --- | --- |
| Instagram organic | `instagram` | `social` |
| Instagram Ads | `instagram` | `paid_social` |
| Facebook organic | `facebook` | `social` |
| Facebook Ads | `facebook` | `paid_social` |
| Google organic | `google` | `organic` |
| Google Ads | `google` | `cpc` |

Recommended campaign format: `tango-tenors-haus-der-sinne-2026-10-18`. Use `utm_content` for the placement or creative, for example `story`, `feed`, or `reel`. Keep `utm_term` for paid search keywords; do not put names, email addresses, or other personal information in UTM values.

Example Instagram organic link:

```text
https://tangotenors.com/?utm_source=instagram&utm_medium=social&utm_campaign=tango-tenors-haus-der-sinne-2026-10-18&utm_content=bio
```

## Events

- `ticket_click`: Eventim Light clicks, with event ID/name, venue, date, language, and source page when event metadata is available.
- `booking_click`: booking CTA and email-contact clicks. No email address or message content is sent.
- `instagram_click`: Instagram links, with placement, language, and source page.
- `language_switch`: language changes, with the destination language and source page.
- `video_play`: first playback per embedded video per page load, with video ID/title, language, and source page.
- `contact_submit`: reserved for a confirmed-success signal (`tango:contact-submit-success`) from a form integration. No contact form currently exists on the site, so this event will not be emitted until a form integration dispatches that event after successful submission.

An Eventim click records intent to visit the ticket shop, not a completed or paid order. Eventim sales are not available to this website's Umami property unless Eventim supplies a separate sales integration.
