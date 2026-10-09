(() => {
  const language = document.documentElement.lang === "de" ? "de" : "en";
  const copy = {
    de: {
      archive: "KONZERTARCHIV",
      details: "KONZERTDETAILS ANSEHEN",
      timeSuffix: "UHR",
      groupName: "Tango Tenors",
      members: ["Rolando Guy", "Gastón Efficace"]
    },
    en: {
      archive: "CONCERT ARCHIVE",
      details: "VIEW CONCERT DETAILS",
      timeSuffix: "",
      groupName: "Tango Tenors",
      members: ["Rolando Guy", "Gastón Efficace"]
    }
  }[language];
  const events = window.TANGO_EVENTS || [];
  const timeZone = "Europe/Berlin";
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const part = type => dateParts.find(item => item.type === type).value;
  const berlinToday = `${part("year")}-${part("month")}-${part("day")}`;
  const nextEvent = events.find(event => event.date >= berlinToday);
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

  const archive = document.getElementById("concert-list");
  if (archive) {
    archive.innerHTML = events.map(event => `
      <article class="concert-detail" id="${esc(event.id)}">
        <p class="concert-date">${esc(event.dateLabel[language])}</p>
        <p class="concert-time">${esc(event.time)}</p>
        <p class="venue">${esc(event.venue).toLocaleUpperCase(language)}<br />${event.address.map(esc).join("<br />").toLocaleUpperCase(language)}</p>
        ${event.price ? `<p class="ticket-price">${esc(event.price[language]).replace("\n", "<br />")}</p>` : ""}
        ${event.ticketUrl ? `<a class="ticket-link" href="${esc(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">${esc(event.ticketLabel[language])} <span aria-hidden="true">↗</span></a>` : ""}
      </article>`).join("");
  }

  if (nextEvent) {
    const cta = document.getElementById("upcoming-concert-cta");
    if (cta) {
      const date = cta.querySelector(".hero-concert-date");
      const link = cta.querySelector("a");
      date.textContent = [nextEvent.dateLabel[language], nextEvent.venue.toLocaleUpperCase(language), `${nextEvent.time}${copy.timeSuffix ? ` ${copy.timeSuffix}` : ""}`].join(" · ");
      if (nextEvent.ticketUrl) {
        link.href = nextEvent.ticketUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
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
    event: events.map(event => ({
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
})();
