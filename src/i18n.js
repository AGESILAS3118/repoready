/**
 * i18n Module for RepoReady UI
 * Node-safe, zero network requests, localStorage wrapped in try/catch.
 */

const UI_STRINGS = {
  en: {
    appTitle: "RepoReady",
    appTagline: "Make your repo community-ready in 2 minutes, in English or French.",
    disclaimerText: "⚠️ Disclaimer: These files are generic templates provided for convenience. Please review them carefully before committing. This tool does not provide legal advice.",
    formHeading: "Project Details",
    labelProject: "Project Name",
    phProject: "e.g. RepoReady",
    labelOwner: "Owner (GitHub username or org)",
    phOwner: "e.g. octocat",
    labelDescription: "One-sentence Description",
    phDescription: "e.g. A fast client-side community files generator for GitHub.",
    labelEmail: "Security Contact E-mail",
    phEmail: "e.g. security@example.com",
    labelType: "Project Type",
    typeLibrary: "Library / Package",
    typeApp: "Application / Web App",
    typeDocs: "Documentation / Course",
    typeOther: "Other",
    labelEcosystems: "Ecosystems Used (for Dependabot)",
    labelMaintainers: "Maintainers (comma-separated handles)",
    phMaintainers: "e.g. @octocat, @devlead",
    labelLicense: "License",
    labelOutputLang: "Generated Files Language",
    langEn: "English",
    langFr: "French",
    langBoth: "Both (Bilingual EN/FR)",
    labelSponsor: "Sponsor Handle (optional, for FUNDING.yml)",
    phSponsor: "e.g. octocat",
    previewHeading: "Generated Community Files",
    btnCopy: "Copy Content",
    btnCopied: "Copied!",
    btnDownloadZip: "Download ZIP Archive",
    btnCreateOnGithub: "Create on GitHub",
    noteEmptyRepo: "Note: You must have already created the empty repository on GitHub.",
    noteUrlTooLong: "URL length exceeds GitHub prefill limit (~6000 chars). Please use Copy or Download ZIP.",
    helpHeader: "Where does this file go?",
    themeToggle: "Toggle Theme",
    errorInvalidOwner: "Invalid GitHub handle. Only letters, digits, and single hyphens are allowed (no spaces or accents).",
    noteNoEcosystems: "No ecosystem selected. dependabot.yml will not be generated.",
    warningMissingFields: "⚠️ Missing or invalid required fields: "
  },
  fr: {
    appTitle: "RepoReady",
    appTagline: "Rends ton dépôt prêt pour la communauté en 2 minutes, en anglais ou en français.",
    disclaimerText: "⚠️ Avertissement : Ces fichiers sont des modèles génériques fournis à titre indicatif. Veuillez les relire attentivement avant de les publier. Cet outil ne constitue pas un conseil juridique.",
    formHeading: "Détails du projet",
    labelProject: "Nom du projet",
    phProject: "ex. RepoReady",
    labelOwner: "Propriétaire (pseudo GitHub ou organisation)",
    phOwner: "ex. octocat",
    labelDescription: "Description en une phrase",
    phDescription: "ex. Un générateur rapide de fichiers de communauté pour GitHub.",
    labelEmail: "E-mail de contact sécurité",
    phEmail: "ex. securite@exemple.com",
    labelType: "Type de projet",
    typeLibrary: "Bibliothèque / Paquet",
    typeApp: "Application / App Web",
    typeDocs: "Documentation / Cours",
    typeOther: "Autre",
    labelEcosystems: "Écosystèmes utilisés (pour Dependabot)",
    labelMaintainers: "Mainteneurs (pseudos séparés par des virgules)",
    phMaintainers: "ex. @octocat, @devlead",
    labelLicense: "Licence",
    labelOutputLang: "Langue des fichiers générés",
    langEn: "Anglais",
    langFr: "Français",
    langBoth: "Les deux (Bilingue EN/FR)",
    labelSponsor: "Pseudo Sponsor (optionnel, pour FUNDING.yml)",
    phSponsor: "ex. octocat",
    previewHeading: "Fichiers de communauté générés",
    btnCopy: "Copier le contenu",
    btnCopied: "Copié !",
    btnDownloadZip: "Télécharger le ZIP",
    btnCreateOnGithub: "Créer sur GitHub",
    noteEmptyRepo: "Note : Vous devez déjà avoir créé le dépôt vierge sur GitHub.",
    noteUrlTooLong: "La longueur de l'URL dépasse la limite de préremplissage de GitHub (~6000 caract.). Utilisez le bouton Copier ou Télécharger le ZIP.",
    helpHeader: "Où placer ce fichier ?",
    themeToggle: "Changer de thème",
    errorInvalidOwner: "Pseudo GitHub invalide. Seuls les lettres, chiffres et tirets simples sont autorisés (sans espaces ni accents).",
    noteNoEcosystems: "Aucun écosystème sélectionné. dependabot.yml ne sera pas généré.",
    warningMissingFields: "⚠️ Champs obligatoires manquants ou invalides : "
  }
};

let currentLang = 'en';

/**
 * Detects browser language safely.
 */
export function detectLanguage() {
  let lang = 'en';
  try {
    const saved = localStorage.getItem('repoready_lang');
    if (saved && (saved === 'en' || saved === 'fr')) {
      return saved;
    }
  } catch (e) {
    // Ignore storage errors
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('fr')) {
      lang = 'fr';
    }
  }

  return lang;
}

/**
 * Sets current language and persists in localStorage.
 * @param {string} lang 
 */
export function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'fr') return;
  currentLang = lang;
  try {
    localStorage.setItem('repoready_lang', lang);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Gets current UI language.
 * @returns {string} 'en' or 'fr'
 */
export function getLanguage() {
  return currentLang;
}

/**
 * Gets UI string translation by key.
 * @param {string} key 
 * @param {string} overrideLang 
 * @returns {string}
 */
export function t(key, overrideLang = null) {
  const lang = overrideLang || currentLang;
  const dict = UI_STRINGS[lang] || UI_STRINGS.en;
  return dict[key] || UI_STRINGS.en[key] || key;
}

// Initialise language state safely
currentLang = detectLanguage();
