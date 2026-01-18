const supportedLangs = ["en", "es"];
let currentLang = "en";
let currentData = null;

function getPreferredLang() {
  const url = new URL(window.location.href);
  const urlLang = url.searchParams.get("lang");
  if (supportedLangs.includes(urlLang)) {
    return urlLang;
  }
  const storedLang = localStorage.getItem("lang");
  if (supportedLangs.includes(storedLang)) {
    return storedLang;
  }
  return "en";
}

function updateUrlLang(lang) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url.toString());
}

function setTextById(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setTextByDataKey(key, value) {
  document.querySelectorAll(`[data-i18n="${key}"]`).forEach((element) => {
    element.textContent = value;
  });
}

function updateLanguageButtons(lang) {
  document.querySelectorAll(".language-button").forEach((btn) => {
    btn.classList.remove("active-language");
    btn.setAttribute("aria-pressed", "false");
  });
  const activeButton = document.getElementById(`${lang}-btn`);
  if (activeButton) {
    activeButton.classList.add("active-language");
    activeButton.setAttribute("aria-pressed", "true");
  }
}

function withLang(href, lang) {
  const parts = href.split("#");
  const path = parts[0];
  const hash = parts[1] ? `#${parts[1]}` : "";
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${lang}${hash}`;
}

function updateNavLinks(lang) {
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const base = link.getAttribute("data-nav-link");
    link.setAttribute("href", withLang(base, lang));
  });
}

function applyStackIconFallbacks() {
  document.querySelectorAll("img.stack-icon").forEach((img) => {
    const fallbackSrc = img.dataset.fallback;
    if (!fallbackSrc) {
      return;
    }

    const markLoaded = () => {
      img.classList.add("is-loaded");
    };

    img.addEventListener("load", markLoaded);

    img.addEventListener("error", () => {
      img.src = fallbackSrc;
    });

    if (img.complete) {
      if (img.naturalWidth === 0) {
        img.src = fallbackSrc;
      } else {
        markLoaded();
      }
    }
  });
}

function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";
  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const tags = Array.isArray(project.tags) ? project.tags : [];
    const tagsMarkup = tags.length
      ? `<ul class="project-tags">${tags.map((tag) => `<li data-tech="${tag}">${tag}</li>`).join("")}</ul>`
      : "";

    const domainMarkup = project.domain
      ? `<span class="project-domain">${project.domain}</span>`
      : "";

    card.innerHTML = `
      <a class="project-card__link" href="${withLang(`projects/${project.slug}/index.html`, currentLang)}">
        <div class="project-card__header">
          <h3>${project.title}</h3>
          ${domainMarkup}
        </div>
        <div class="project-card__problem">
          <span class="label">Problem</span>
          <p>${project.problem || ""}</p>
        </div>
        <div class="project-card__impact">
          <span class="label">Impact</span>
          <p>${project.impact || ""}</p>
        </div>
        ${tagsMarkup}
      </a>
    `;

    grid.appendChild(card);
  });
}

function renderProjectDetails(projects) {
  const slug = document.body.dataset.projectSlug;
  if (!slug) {
    return;
  }

  const project = projects.find((item) => item.slug === slug);
  if (!project) {
    setTextById("project-title", "Project not found");
    return;
  }

  setTextById("project-title", project.title);
  setTextById("project-summary", project.impact || project.summary || "");
  const highlightsList = document.getElementById("project-highlights");
  if (highlightsList) {
    highlightsList.innerHTML = "";
    project.highlights.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      highlightsList.appendChild(li);
    });
  }

  const tagsList = document.getElementById("project-tags");
  if (tagsList) {
    tagsList.innerHTML = "";
    (project.tags || []).forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      tagsList.appendChild(li);
    });
  }

  document.title = `DevPold - ${project.title}`;
}

function applyLabels(labels) {
  setTextById("language-label", labels.languageLabel);
  setTextById("about-title", labels.aboutTitle);
  setTextById("about-description", labels.aboutDescription);
  setTextById("projects-title", labels.projectsTitle);
  setTextById("projects-subtitle", labels.projectsSubtitle);
  setTextById("contact-title", labels.contactTitle);
  setTextById("contact-description", labels.contactDescription);
  setTextById("project-details-heading", labels.projectDetailsTitle);

  setTextByDataKey("navAbout", labels.navAbout);
  setTextByDataKey("navProjects", labels.navProjects);
  setTextByDataKey("navStack", labels.navStack);
  setTextByDataKey("navContact", labels.navContact);
  setTextByDataKey("stackTitle", labels.stackTitle);
  setTextByDataKey("stackSubtitle", labels.stackSubtitle);
  setTextByDataKey("backToHome", labels.backToHome);
  setTextByDataKey("highlightsLabel", labels.highlightsLabel);
}

function getI18nBasePath() {
  if (document.body.dataset.projectSlug) {
    return "../../../assets/i18n";
  }
  return "assets/i18n";
}

async function fetchLanguageData(lang) {
  const response = await fetch(`${getI18nBasePath()}/${lang}.json`);
  if (!response.ok) {
    throw new Error(`Unable to load language: ${lang}`);
  }
  return response.json();
}

async function setLanguage(lang) {
  if (!supportedLangs.includes(lang)) {
    currentLang = "en";
  } else {
    currentLang = lang;
  }

  try {
    currentData = await fetchLanguageData(currentLang);
  } catch (error) {
    currentLang = "en";
    currentData = await fetchLanguageData("en");
  }

  localStorage.setItem("lang", currentLang);
  updateUrlLang(currentLang);
  updateLanguageButtons(currentLang);
  updateNavLinks(currentLang);
  applyLabels(currentData.labels);
  renderProjects(currentData.projects);
  renderProjectDetails(currentData.projects);

  document.documentElement.setAttribute("lang", currentLang);
}

document.addEventListener("DOMContentLoaded", () => {
  const initialLang = getPreferredLang();
  setLanguage(initialLang);
  applyStackIconFallbacks();
});
