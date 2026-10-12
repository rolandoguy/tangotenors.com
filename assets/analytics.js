(() => {
  const language = () => document.documentElement.lang === "de" ? "de" : "en";
  const track = (name, data = {}) => {
    try {
      if (window.umami && typeof window.umami.track === "function") {
        window.umami.track(name, { language: language(), page: window.location.pathname, ...data });
      }
    } catch (error) {
      // Analytics failures must never interrupt normal site behavior.
    }
  };

  if (document.documentElement.dataset.analyticsBound !== "true") {
    document.documentElement.dataset.analyticsBound = "true";
    document.addEventListener("click", event => {
      const element = event.target instanceof Element ? event.target : null;
      const link = element?.closest("a");
      const languageButton = element?.closest("button[data-lang-toggle]");

      if (languageButton) {
        track("language_switch", { language_to: languageButton.dataset.langToggle });
        return;
      }
      if (!link) return;

      let url;
      try { url = new URL(link.href, window.location.href); } catch { return; }
      if (/(^|\.)eventim-light\.com$/i.test(url.hostname)) {
        const event = (window.TANGO_EVENTS || []).find(item => item.ticketUrl && new URL(item.ticketUrl, window.location.href).href === url.href);
        const localizedNameKey = `concertName${language()[0].toUpperCase()}${language().slice(1)}`;
        track("ticket_click", {
          ...(event ? {
            concert_id: event.id,
            concert_name: event.name[language()],
            venue: event.venue,
            concert_date: event.date
          } : link.dataset.concertId ? {
            concert_id: link.dataset.concertId,
            ...(link.dataset[localizedNameKey] ? { concert_name: link.dataset[localizedNameKey] } : {}),
            ...(link.dataset.venue ? { venue: link.dataset.venue } : {}),
            ...(link.dataset.concertDate ? { concert_date: link.dataset.concertDate } : {})
          } : {})
        });
      } else if (/(^|\.)instagram\.com$/i.test(url.hostname)) {
        track("instagram_click", { placement: link.closest("footer") ? "footer" : link.closest("nav") ? "navigation" : "content" });
      } else if (link.matches(".booking-link, [data-booking-cta]")) {
        track("booking_click", { placement: link.dataset.bookingPlacement || "booking_cta" });
      } else if (link.matches('.contact-links a[href^="mailto:"], .contact-details a[href^="mailto:"]')) {
        track("booking_click", { placement: "email_contact" });
      } else if (link.matches(".language-switch a[lang]")) {
        track("language_switch", { language_to: link.lang });
      }
    });

    // Dispatch this only after a contact form's backend confirms success.
    document.addEventListener("tango:contact-submit-success", event => {
      track("contact_submit", { form: "contact" });
    });
  }

  const frames = [...document.querySelectorAll('iframe[src*="youtube.com/embed/"]')];
  if (!frames.length) return;
  const videoIds = new WeakMap();
  frames.forEach(frame => {
    const url = new URL(frame.src);
    videoIds.set(frame, url.pathname.split("/").filter(Boolean).pop());
  });

  let apiRequested = false;
  const loadPlayerApi = () => {
    if (apiRequested) return;
    apiRequested = true;
    const api = document.createElement("script");
    api.src = "https://www.youtube.com/iframe_api";
    api.async = true;
    document.head.append(api);
    window.onYouTubeIframeAPIReady = () => frames.forEach(frame => {
      if (frame.dataset.analyticsPlayerBound === "true") return;
      frame.dataset.analyticsPlayerBound = "true";
      new window.YT.Player(frame, { events: {
        onStateChange: state => {
          if (state.data === window.YT.PlayerState.PLAYING && frame.dataset.analyticsPlayTracked !== "true") {
            frame.dataset.analyticsPlayTracked = "true";
            track("video_play", { video_id: videoIds.get(frame), video_title: frame.title });
          }
        }
      } });
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadPlayerApi();
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    frames.forEach(frame => observer.observe(frame));
  } else loadPlayerApi();
})();
