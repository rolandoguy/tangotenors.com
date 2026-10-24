(() => {
  const copy = {
    de: { archive: "KONZERTARCHIV", upcoming: "KOMMENDE KONZERTE", menuOpen: "Menü öffnen", menuClose: "Menü schließen", details: "KONZERTDETAILS ANSEHEN", timeSuffix: "UHR", map: "ANFAHRT & VERANSTALTUNGSORT", groupName: "Tango Tenors", members: ["Rolando Guy", "Gastón Efficace"], historical: "VERGANGENE VERANSTALTUNG", noDate: "Derzeit sind keine öffentlichen Konzerte geplant.", pressNext: "NÄCHSTER ÖFFENTLICHER TERMIN", pressTickets: "TICKETS & KONZERTINFO" },
    en: { archive: "CONCERT ARCHIVE", upcoming: "UPCOMING CONCERTS", menuOpen: "Open menu", menuClose: "Close menu", details: "VIEW CONCERT DETAILS", timeSuffix: "", map: "DIRECTIONS & VENUE", groupName: "Tango Tenors", members: ["Rolando Guy", "Gastón Efficace"], historical: "PAST EVENT", noDate: "No public concerts are currently scheduled.", pressNext: "NEXT PUBLIC PERFORMANCE", pressTickets: "TICKETS & CONCERT INFO" }
  };
  const getLanguage = () => document.documentElement.lang === "de" ? "de" : "en";
  let language = getLanguage();
  let text = copy[language];
  const events = window.TANGO_EVENTS || [];
  const settings = window.TANGO_EVENT_SETTINGS || {};
  const calendar = window.TANGO_CONCERT_CALENDAR;
  if (!calendar) return;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  const eventDate = event => calendar.eventDate(event);
  const formatDate = event => event.dateLabel?.[language] || new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
    timeZone: settings.timeZone || "Europe/Berlin", day: "numeric", month: "long", year: "numeric"
  }).format(new Date(`${eventDate(event)}T12:00:00Z`)).toLocaleUpperCase(language);
  const formatTime = event => {
    if (event.time) return event.time;
    const instant = calendar.parseInstant(event.startDate);
    return instant === null ? "" : new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
      timeZone: settings.timeZone || "Europe/Berlin", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).format(new Date(instant));
  };
  const addressSchema = event => ({
    "@type": "PostalAddress",
    ...(event.address?.length > 1 ? { streetAddress: event.address[0], postalCode: event.address[1].split(" ")[0], addressLocality: "Berlin" } : { addressLocality: "Berlin" }),
    addressCountry: "DE"
  });
  const renderEvents = (target, items, heading, archived = false) => {
    if (!target) return;
    target.innerHTML = items.length ? `${heading ? `<h2 class="concert-subtitle">${esc(heading)}</h2>` : ""}${items.map(event => `
      <article class="concert-detail" id="${esc(event.id)}">
        <p class="concert-date">${esc(formatDate(event))}</p>
        ${formatTime(event) ? `<p class="concert-time">${esc(formatTime(event))}</p>` : ""}
        <p class="venue">${esc(event.venue).toLocaleUpperCase(language)}<br />${(event.address || []).map(esc).join("<br />").toLocaleUpperCase(language)}</p>
        ${event.price?.[language] ? `<p class="ticket-price">${esc(event.price[language]).replace("\n", "<br />")}</p>` : ""}
        ${archived && event.ticketUrl ? `<a class="historical-link" href="${esc(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">${esc(text.historical)} <span aria-hidden="true">↗</span></a>` : !archived && event.ticketUrl ? `<a class="ticket-link" data-outbound="ticket" data-concert-id="${esc(event.id)}" href="${esc(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">${esc(event.ticketLabel?.[language] || text.details)} <span aria-hidden="true">↗</span></a>` : ""}
      </article>`).join("")}` : "";
  };
  const upcomingList = document.getElementById("upcoming-concert-list");
  const archiveList = document.getElementById("concert-list");
  const heroCta = document.getElementById("upcoming-concert-cta");
  const hero = heroCta?.closest(".hero");
  const pressNext = document.getElementById("press-next-performance");
  const schema = document.querySelector("script[data-concert-schema]") || document.createElement("script");
  schema.type = "application/ld+json";
  schema.dataset.concertSchema = "true";
  if (!schema.isConnected) document.head.append(schema);

  const renderHero = event => {
    if (!heroCta) return;
    if (!event) { heroCta.hidden = true; hero?.classList.remove("has-upcoming-event"); return; }
    hero?.classList.add("has-upcoming-event");
    const date = heroCta.querySelector(".hero-concert-date");
    if (date) date.textContent = `${event.weekdayLabel?.[language] ? `${event.weekdayLabel[language]}, ` : ""}${formatDate(event)}`;
    const place = heroCta.querySelector(".hero-concert-place");
    if (place) place.textContent = [
      `${formatTime(event)}${text.timeSuffix && formatTime(event) ? ` ${text.timeSuffix}` : ""}`,
      event.venue.toLocaleUpperCase(language),
      event.locationLabel?.[language] || (event.address || []).join(", ").toLocaleUpperCase(language)
    ].filter(Boolean).join(" | ");
    for (const [selector, value] of [
      [".hero-concert-invitation", event.invitation?.[language]],
      [".hero-concert-description", event.description?.[language]],
      [".hero-concert-price", event.price?.[language]]
    ]) {
      const node = heroCta.querySelector(selector);
      if (node) { node.textContent = value || ""; node.hidden = !node.textContent; }
    }
    const mapLink = heroCta.querySelector(".hero-concert-map");
    if (mapLink) {
      mapLink.hidden = !event.mapUrl;
      if (event.mapUrl) { mapLink.href = event.mapUrl; mapLink.dataset.outbound = "maps"; mapLink.innerHTML = `${esc(text.map)} <span aria-hidden="true">↗</span>`; }
    }
    const link = heroCta.querySelector(".ticket-link-hero");
    if (link) {
      link.hidden = false;
      if (event.ticketUrl) {
        link.href = event.ticketUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.dataset.outbound = "ticket"; link.dataset.concertId = event.id;
        link.innerHTML = `${esc(event.ticketLabel?.[language] || text.details)} <span aria-hidden="true">↗</span>`;
      } else {
        link.href = `#${event.id}`; link.removeAttribute("target"); link.removeAttribute("rel");
        delete link.dataset.outbound; delete link.dataset.concertId; link.textContent = text.details;
      }
    }
    heroCta.hidden = false;
  };

  const renderPressNext = event => {
    if (!pressNext) return;
    pressNext.querySelectorAll(".press-next-label").forEach(label => {
      const labelLanguage = label.classList.contains("lang-de") ? "de" : "en";
      label.textContent = event ? copy[labelLanguage].pressNext : copy[labelLanguage].upcoming;
    });
    const line = document.getElementById("press-event-line");
    const address = document.getElementById("press-event-address");
    const prices = document.getElementById("press-event-tickets");
    const ticket = document.getElementById("press-event-ticket-link");
    if (!event) {
      if (line) line.textContent = text.noDate;
      if (address) address.hidden = true;
      if (prices) prices.hidden = true;
      if (ticket) ticket.hidden = true;
      return;
    }
    if (line) {
      const place = event.locationLabel?.[language] || event.address?.[event.address.length - 1] || "Berlin";
      const time = formatTime(event);
      line.textContent = `${event.venue} · ${place}\n${formatDate(event)}${time ? ` · ${time}` : ""}`;
    }
    if (address) {
      const streetLines = (event.address || []).filter((value, index, list) => !(index === list.length - 1 && value === "Berlin"));
      address.textContent = streetLines.join("\n"); address.hidden = !address.textContent;
    }
    if (prices) { prices.textContent = event.price?.[language] || ""; prices.hidden = !prices.textContent; }
    if (ticket) {
      ticket.hidden = false;
      ticket.href = event.ticketUrl || `/#concert`;
      ticket.dataset.concertId = event.id;
      if (event.ticketUrl) ticket.dataset.outbound = "ticket"; else delete ticket.dataset.outbound;
      ticket.querySelectorAll(".press-ticket-label").forEach(labelNode => {
        const labelLanguage = labelNode.classList.contains("lang-de") ? "de" : "en";
        labelNode.textContent = event.ticketUrl ? copy[labelLanguage].pressTickets : copy[labelLanguage].details;
      });
    }
  };

  const updateStructuredData = upcoming => {
    const data = {
      "@context": "https://schema.org", "@type": "MusicGroup", name: text.groupName,
      url: language === "de" ? "https://tangotenors.com/" : "https://tangotenors.com/en/",
      sameAs: ["https://www.instagram.com/tangotenors/"],
      member: text.members.map(name => ({ "@type": "Person", name })),
      event: upcoming.map(event => ({
        "@type": "MusicEvent", name: event.name[language], startDate: event.startDate || event.date,
        location: { "@type": "Place", name: event.venue, address: addressSchema(event) },
        performer: { "@type": "MusicGroup", name: text.groupName },
        ...(event.offers ? { offers: event.offers.map(offer => ({ "@type": "Offer", name: offer.name[language], price: offer.price, priceCurrency: "EUR" })) } : {})
      }))
    };
    schema.textContent = JSON.stringify(data);
  };

  let previousState = "";
  const update = (force = false) => {
    language = getLanguage();
    text = copy[language];
    const snapshot = calendar.classify(events, Date.now(), settings);
    const state = `${snapshot.upcoming.map(event => event.id).join(",")}|${snapshot.archived.map(event => event.id).join(",")}`;
    if (!force && state === previousState) return;
    previousState = state;
    renderEvents(upcomingList, snapshot.upcoming, text.upcoming);
    renderEvents(archiveList, snapshot.archived, text.archive, true);
    renderHero(snapshot.upcoming[0]);
    renderPressNext(snapshot.upcoming[0]);
    updateStructuredData(snapshot.upcoming);
  };
  update(true);

  let transitionTimer;
  const scheduleTransition = () => {
    clearTimeout(transitionTimer);
    const transition = calendar.nextTransition(events, Date.now(), settings);
    if (transition === null) return;
    const delay = Math.max(50, Math.min(transition - Date.now() + 25, 2_147_000_000));
    transitionTimer = window.setTimeout(() => { update(); scheduleTransition(); }, delay);
  };
  scheduleTransition();
  window.setInterval(() => { update(); scheduleTransition(); }, 60_000);
  ["focus", "pageshow"].forEach(name => window.addEventListener(name, () => { update(); scheduleTransition(); }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { update(); scheduleTransition(); } });
  document.addEventListener("tt:languagechange", () => update(true));

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("primary-navigation");
  if (header && toggle && nav) {
    const setMenu = open => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? copy[language].menuClose : copy[language].menuOpen);
      header.classList.toggle("menu-open", open);
      document.body.classList.toggle("menu-is-open", open);
    };
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    nav.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", event => { if (event.key === "Escape") { setMenu(false); toggle.focus(); } });
    document.addEventListener("click", event => { if (!header.contains(event.target)) setMenu(false); });
    const languageLinks = nav.querySelectorAll(".language-switch a");
    const syncLanguageAnchors = () => languageLinks.forEach(link => { link.href = `${link.origin}${link.pathname}${window.location.hash}`; });
    syncLanguageAnchors();
    window.addEventListener("hashchange", syncLanguageAnchors);
    const sections = [...nav.querySelectorAll('a[href^="#"]')].map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        const link = nav.querySelector(`a[href="#${entry.target.id}"]`);
        if (link && entry.isIntersecting) {
          nav.querySelectorAll("a[aria-current='location']").forEach(item => item.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "location");
        }
      }), { rootMargin: "-20% 0px -68% 0px" });
      sections.forEach(section => observer.observe(section));
    }
  }
})();
