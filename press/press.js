(() => {
  const buttons = document.querySelectorAll("[data-lang-toggle]");

  function setLanguage(language) {
    document.documentElement.dataset.lang = language;
    document.documentElement.lang = language;
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.langToggle === language));
    });
    try { localStorage.setItem("tt-language", language); } catch (error) {}
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.langToggle));
  });

  setLanguage(document.documentElement.dataset.lang || "de");
})();
