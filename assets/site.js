(() => {
  const language = document.documentElement.lang === "de" ? "de" : "en";
  const copy = {
    de: {
      archive: "KONZERTARCHIV",
      upcoming: "NÄCHSTE KONZERTE",
      menuOpen: "Menü öffnen",
      menuClose: "Menü schließen",
      details: "KONZERTDETAILS ANSEHEN",
      timeSuffix: "UHR",
      map: "ANFAHRT & VERANSTALTUNGSORT",
      groupName: "Tango Tenors",
      members: ["Rolando Guy", "Gastón Efficace"]
    },
    en: {
      archive: "CONCERT ARCHIVE",
      upcoming: "UPCOMING CONCERTS",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      details: "VIEW CONCERT DETAILS",
      timeSuffix: "",
      map: "DIRECTIONS & VENUE",
      groupName: "Tango Tenors",
      members: ["Rolando Guy", "Gastón Efficace"]
    }
  }[language];
  const events = window.TANGO_EVENTS || [];
  const uniqueEvents = [...new Map(events.filter(event => event?.id && event?.date && event?.startDate)
    .map(event => [event.id, event])).values()];
  const now = Date.now();
  const isUpcoming = event => Date.parse(event.startDate) > now;
  const futureEvents = uniqueEvents.filter(isUpcoming)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const pastEvents = uniqueEvents.filter(event => !isUpcoming(event))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const nextEvent = futureEvents[0];
  const esc = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[character]);
  const addressSchema = event => ({
    "@type": "PostalAddress",
    ...(event.address.length > 1 ? {
      streetAddress: event.address[0],
      postalCode: event.address[1].split(" ")[0],
      addressLocality: "Berlin"
    } : { addressLocality: "Berlin" }),
    addressCountry: "DE"
  });

  const renderEvents = (target, items, heading) => {
    if (!target) return;
    target.innerHTML = items.length ? `${heading ? `<h2 class="concert-subtitle">${esc(heading)}</h2>` : ""}${items.map(event => `
      <article class="concert-detail" id="${esc(event.id)}">
        <p class="concert-date">${esc(event.dateLabel[language])}</p>
        ${event.time ? `<p class="concert-time">${esc(event.time)}</p>` : ""}
        <p class="venue">${esc(event.venue).toLocaleUpperCase(language)}<br />${event.address.map(esc).join("<br />").toLocaleUpperCase(language)}</p>
        ${event.price ? `<p class="ticket-price">${esc(event.price[language]).replace("\n", "<br />")}</p>` : ""}
        ${event.ticketUrl && isUpcoming(event) ? `<a class="ticket-link" data-outbound="ticket" data-concert-id="${esc(event.id)}" href="${esc(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">${esc(event.ticketLabel[language])} <span aria-hidden="true">↗</span></a>` : event.ticketUrl ? `<a class="historical-link" href="${esc(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">${language === "de" ? "VERGANGENE VERANSTALTUNG" : "PAST EVENT"} <span aria-hidden="true">↗</span></a>` : ""}
      </article>`).join("")}` : "";
  };
  renderEvents(document.getElementById("upcoming-concert-list"), futureEvents, copy.upcoming);
  renderEvents(document.getElementById("concert-list"), pastEvents, copy.archive);

  if (nextEvent) {
    const cta = document.getElementById("upcoming-concert-cta");
    if (cta) {
      cta.closest(".hero")?.classList.add("has-upcoming-event");
      const date = cta.querySelector(".hero-concert-date");
      const link = cta.querySelector(".ticket-link-hero");
      date.textContent = `${nextEvent.weekdayLabel?.[language] ? `${nextEvent.weekdayLabel[language]}, ` : ""}${nextEvent.dateLabel[language]}`;
      const place = cta.querySelector(".hero-concert-place");
      place.textContent = [
        `${nextEvent.time}${copy.timeSuffix ? ` ${copy.timeSuffix}` : ""}`,
        nextEvent.venue.toLocaleUpperCase(language),
        nextEvent.locationLabel?.[language] || nextEvent.address.join(", ").toLocaleUpperCase(language)
      ].join(" | ");
      const invitation = cta.querySelector(".hero-concert-invitation");
      invitation.textContent = nextEvent.invitation?.[language] || "";
      invitation.hidden = !invitation.textContent;
      const description = cta.querySelector(".hero-concert-description");
      description.textContent = nextEvent.description?.[language] || "";
      description.hidden = !description.textContent;
      const price = cta.querySelector(".hero-concert-price");
      price.textContent = nextEvent.price?.[language] || "";
      price.hidden = !price.textContent;
      const mapLink = cta.querySelector(".hero-concert-map");
      if (nextEvent.mapUrl) {
        mapLink.href = nextEvent.mapUrl;
        mapLink.dataset.outbound = "maps";
        mapLink.innerHTML = `${esc(copy.map)} <span aria-hidden="true">↗</span>`;
      } else mapLink.hidden = true;
      if (nextEvent.ticketUrl) {
        link.href = nextEvent.ticketUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.dataset.outbound = "ticket";
        link.dataset.concertId = nextEvent.id;
        link.innerHTML = `${esc(nextEvent.ticketLabel[language])} <span aria-hidden="true">↗</span>`;
      } else {
        link.href = `#${nextEvent.id}`;
        link.textContent = copy.details;
      }
      cta.hidden = false;
    }
  }


  const musicGroup = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: copy.groupName,
    url: language === "de" ? "https://tangotenors.com/" : "https://tangotenors.com/en/",
    sameAs: ["https://www.instagram.com/tangotenors/"],
    member: copy.members.map(name => ({ "@type": "Person", name })),
    event: futureEvents.map(event => ({
      "@type": "MusicEvent",
      name: event.name[language],
      startDate: event.startDate,
      location: {
        "@type": "Place",
        name: event.venue,
        address: addressSchema(event)
      },
      performer: { "@type": "MusicGroup", name: copy.groupName },
      ...(event.offers ? {
        offers: event.offers.map(offer => ({
          "@type": "Offer",
          name: offer.name[language],
          price: offer.price,
          priceCurrency: "EUR"
        }))
      } : {})
    }))
  };
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify(musicGroup);
  document.head.append(schema);

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("primary-navigation");
  if (header && toggle && nav) {
    const setMenu = open => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? copy.menuClose : copy.menuOpen);
      header.classList.toggle("menu-open", open);
      document.body.classList.toggle("menu-is-open", open);
    };
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    nav.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", event => { if (event.key === "Escape") { setMenu(false); toggle.focus(); } });
    document.addEventListener("click", event => { if (!header.contains(event.target)) setMenu(false); });
    const languageLinks = nav.querySelectorAll(".language-switch a");
    const syncLanguageAnchors = () => languageLinks.forEach(link => {
      link.href = `${link.origin}${link.pathname}${window.location.hash}`;
    });
    syncLanguageAnchors();
    window.addEventListener("hashchange", syncLanguageAnchors);
    const sections = [...nav.querySelectorAll('a[href^="#"]')].map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const link = nav.querySelector(`a[href="#${entry.target.id}"]`);
          if (link && entry.isIntersecting) {
            nav.querySelectorAll("a[aria-current='location']").forEach(item => item.removeAttribute("aria-current"));
            link.setAttribute("aria-current", "location");
          }
        });
      }, { rootMargin: "-20% 0px -68% 0px" });
      sections.forEach(section => observer.observe(section));
    }
  }
})();
