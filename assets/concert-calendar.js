(function (root, factory) {
  const calendar = factory();
  if (typeof module === "object" && module.exports) module.exports = calendar;
  if (root) root.TANGO_CONCERT_CALENDAR = calendar;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";

  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/i;

  function eventDate(event) {
    const value = event.date || event.startDate;
    return typeof value === "string" && DATE_PATTERN.test(value) ? value : null;
  }

  function parseInstant(value) {
    if (typeof value !== "string" || !INSTANT_PATTERN.test(value)) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function ticketUrlFor(event, language) {
    if (!event || typeof event.ticketUrl !== "string") return "";
    const locale = language === "de" ? "de" : "en";
    return event.ticketUrl.replace(/\/event\/(?:de|en)\//, `/event/${locale}/`);
  }

  function berlinDate(timestamp, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date(timestamp));
    const part = type => parts.find(item => item.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }

  function berlinDateBoundary(date, timeZone) {
    const approximate = Date.parse(`${date}T00:00:00Z`);
    let low = approximate - 36 * 60 * 60 * 1000;
    let high = approximate + 36 * 60 * 60 * 1000;
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if (berlinDate(middle, timeZone) >= date) high = middle;
      else low = middle;
    }
    return high;
  }

  function addCalendarDays(date, count) {
    const [year, month, day] = date.split("-").map(Number);
    const value = new Date(Date.UTC(year, month - 1, day + count));
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  }

  function finishTime(event, defaultDurationMinutes) {
    const start = parseInstant(event.startDate);
    if (start === null) return null;
    const explicitEnd = parseInstant(event.endDate);
    if (explicitEnd !== null && explicitEnd > start) return explicitEnd;
    const duration = Number.isFinite(event.durationMinutes) && event.durationMinutes > 0
      ? event.durationMinutes
      : defaultDurationMinutes;
    return start + duration * 60_000;
  }

  function compareDate(a, b, direction, defaultDurationMinutes) {
    const dateA = eventDate(a.event);
    const dateB = eventDate(b.event);
    if (dateA !== dateB) return direction * dateA.localeCompare(dateB);

    const startA = parseInstant(a.event.startDate);
    const startB = parseInstant(b.event.startDate);
    if (startA !== null && startB !== null && startA !== startB) {
      return direction * (startA - startB);
    }
    const endA = finishTime(a.event, defaultDurationMinutes);
    const endB = finishTime(b.event, defaultDurationMinutes);
    if (direction < 0 && endA !== null && endB !== null && endA !== endB) return endB - endA;
    return a.index - b.index;
  }

  function classify(events, nowValue, settings) {
    const timeZone = settings?.timeZone || "Europe/Berlin";
    const defaultDurationMinutes = Number.isFinite(settings?.defaultDurationMinutes) && settings.defaultDurationMinutes > 0
      ? settings.defaultDurationMinutes
      : 120;
    const now = nowValue instanceof Date ? nowValue.getTime() : Number(nowValue ?? Date.now());
    const today = berlinDate(now, timeZone);
    const unique = new Map();

    (Array.isArray(events) ? events : []).forEach((event, index) => {
      if (!event || typeof event.id !== "string" || !event.id || !eventDate(event)) return;
      // The last record for a stable event ID is canonical if the source has duplicates.
      unique.set(event.id, { event, index });
    });

    const upcoming = [];
    const archived = [];
    for (const entry of unique.values()) {
      const { event } = entry;
      const date = eventDate(event);
      const finish = finishTime(event, defaultDurationMinutes);
      const completed = finish === null ? date < today : finish <= now;
      (completed ? archived : upcoming).push(entry);
    }

    upcoming.sort((a, b) => compareDate(a, b, 1, defaultDurationMinutes));
    archived.sort((a, b) => compareDate(a, b, -1, defaultDurationMinutes));
    return {
      upcoming: upcoming.map(entry => entry.event),
      archived: archived.map(entry => entry.event),
      today,
      defaultDurationMinutes
    };
  }

  function nextTransition(events, nowValue, settings) {
    const timeZone = settings?.timeZone || "Europe/Berlin";
    const defaultDurationMinutes = Number.isFinite(settings?.defaultDurationMinutes) && settings.defaultDurationMinutes > 0
      ? settings.defaultDurationMinutes
      : 120;
    const now = nowValue instanceof Date ? nowValue.getTime() : Number(nowValue ?? Date.now());
    const snapshot = classify(events, now, { timeZone, defaultDurationMinutes });
    const transitions = [];

    for (const event of snapshot.upcoming) {
      const finish = finishTime(event, defaultDurationMinutes);
      if (finish !== null && finish > now) transitions.push(finish);
      else if (!parseInstant(event.startDate)) {
        // Date-only records archive at midnight after their Berlin calendar date.
        transitions.push(berlinDateBoundary(addCalendarDays(eventDate(event), 1), timeZone));
      }
    }
    const validTransitions = transitions.filter(value => value > now);
    if (!snapshot.upcoming.length) return null;
    return validTransitions.length ? Math.min(...validTransitions) : now + 60_000;
  }

  return { classify, eventDate, finishTime, nextTransition, parseInstant, ticketUrlFor };
});
