//lang-toggle.js

document.addEventListener("DOMContentLoaded", () => {
  const langBtn = document.getElementById("lang-btn");
  let currentLang = localStorage.getItem("lang") || getBrowserLang();
  let translations = {};

  function getBrowserLang() {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    return browserLang === 'nl' ? 'nl' : 'en';
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    
    if (langBtn) {
      langBtn.textContent = lang === "en" ? "NL" : "EN";
    }

    // Set inner HTML text
    for (const el of document.querySelectorAll("[data-i18n]")) {
      const key = el.getAttribute("data-i18n");
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    }

    // Set placeholder attributes
    for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[lang] && translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    }

  }

  function loadTranslations() {
    fetch("lang.json")
      .then(res => res.json())
      .then(data => {
        translations = data;
        applyLanguage(currentLang);
      })
      .catch(err => {
        console.error("Error loading translations:", err);
      });
  }

  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const nextLang = currentLang === "en" ? "nl" : "en";
      applyLanguage(nextLang);
    });
  }

  loadTranslations();
});
