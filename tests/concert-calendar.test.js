const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const calendar = require("../assets/concert-calendar.js");

const source = { window: {} };
vm.runInNewContext(fs.readFileSync(require.resolve("../assets/events.js"), "utf8"), source);
const settings = source.window.TANGO_EVENT_SETTINGS;
const byId = new Map(source.window.TANGO_EVENTS.map(event => [event.id, event]));
const events = [
  byId.get("claerchens-ballhaus-2026-09-06"),
  byId.get("haus-der-sinne-2026-10-18"),
  byId.get("claerchens-ballhaus-2026-12-06")
];
const instant = value => Date.parse(value);

test("the canonical source includes only Tango Tenors concerts", () => {
  assert.equal(source.window.TANGO_EVENTS.length, 3);
  assert.ok(source.window.TANGO_EVENTS.every(event => event.name.en.includes("Tango Tenors")));
  assert.ok(source.window.TANGO_EVENTS.every(event => !JSON.stringify(event).includes("Pasiones del Sur")));
});

test("requested 2026 concerts are classified, sorted, and appear once", () => {
  const snapshot = calendar.classify(events, instant("2026-10-24T12:00:00Z"), settings);
  assert.deepEqual(snapshot.archived.map(event => event.id), ["haus-der-sinne-2026-10-18", "claerchens-ballhaus-2026-09-06"]);
  assert.deepEqual(snapshot.upcoming.map(event => event.id), ["claerchens-ballhaus-2026-12-06"]);
  assert.equal(new Set([...snapshot.upcoming, ...snapshot.archived].map(event => event.id)).size, events.length);
});

test("a timed concert remains upcoming through its configured duration, then archives", () => {
  const concert = [events[2]];
  assert.equal(calendar.classify(concert, instant("2026-12-06T20:00:00+01:00"), settings).upcoming.length, 1);
  assert.equal(calendar.classify(concert, instant("2026-12-06T21:59:59+01:00"), settings).upcoming.length, 1);
  assert.equal(calendar.classify(concert, instant("2026-12-06T22:00:00+01:00"), settings).archived.length, 1);
});

test("confirmed end time and per-event duration override the default", () => {
  const event = { id: "explicit", date: "2026-12-06", startDate: "2026-12-06T20:00:00+01:00", endDate: "2026-12-06T20:45:00+01:00", durationMinutes: 30 };
  assert.equal(calendar.finishTime(event, 120), instant("2026-12-06T20:45:00+01:00"));
  assert.equal(calendar.classify([event], instant("2026-12-06T20:45:00+01:00"), settings).archived.length, 1);
  const estimated = { id: "estimated", date: "2026-12-06", startDate: "2026-12-06T20:00:00+01:00", durationMinutes: 75 };
  assert.equal(calendar.finishTime(estimated, 120), instant("2026-12-06T21:15:00+01:00"));
});

test("date-only events do not invent a time and roll over at Berlin midnight", () => {
  const event = events[0];
  assert.equal(calendar.parseInstant(event.startDate), null);
  assert.equal(calendar.classify([event], instant("2026-09-06T21:59:00Z"), settings).upcoming.length, 1);
  assert.equal(calendar.classify([event], instant("2026-09-06T22:00:00Z"), settings).archived.length, 1);
});

test("Berlin daylight-saving transitions use absolute instants and preserve order", () => {
  const repeatedHour = [
    { id: "summer-offset", date: "2026-10-25", startDate: "2026-10-25T02:30:00+02:00" },
    { id: "winter-offset", date: "2026-10-25", startDate: "2026-10-25T02:30:00+01:00" }
  ];
  assert.equal(calendar.finishTime(repeatedHour[0], 120), instant("2026-10-25T03:30:00+01:00"));
  assert.equal(calendar.finishTime(repeatedHour[1], 120), instant("2026-10-25T04:30:00+01:00"));
  const snapshot = calendar.classify(repeatedHour, instant("2026-10-25T01:45:00Z"), settings);
  assert.deepEqual(snapshot.upcoming.map(event => event.id), ["summer-offset", "winter-offset"]);
  assert.deepEqual(calendar.classify(repeatedHour, instant("2026-10-25T02:30:00Z"), settings).archived.map(event => event.id), ["summer-offset"]);
});

test("duplicate IDs resolve once and every event belongs to one section", () => {
  const records = [
    { id: "same", date: "2026-01-01", name: { en: "old" } },
    { id: "same", date: "2026-12-01", name: { en: "canonical" } }
  ];
  const snapshot = calendar.classify(records, instant("2026-06-01T12:00:00Z"), settings);
  assert.equal(snapshot.archived.length + snapshot.upcoming.length, 1);
  assert.equal(snapshot.upcoming[0].name.en, "canonical");
});

test("next transition schedules the estimated finish", () => {
  const now = instant("2026-12-06T21:00:00+01:00");
  assert.equal(calendar.nextTransition([events[2]], now, settings), instant("2026-12-06T22:00:00+01:00"));
});

test("date-only transition uses Berlin midnight after the event date", () => {
  assert.equal(calendar.nextTransition([events[0]], instant("2026-09-06T10:00:00Z"), settings), instant("2026-09-06T22:00:00Z"));
  assert.equal(calendar.nextTransition([{ id: "future", date: "2026-12-06" }], instant("2026-10-24T12:00:00Z"), settings), instant("2026-12-06T23:00:00Z"));
});
