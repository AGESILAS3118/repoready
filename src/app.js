/**
 * Main Application Controller for RepoReady
 * Pure ES module, 100% client-side.
 */

import { getLanguage, setLanguage, t } from './i18n.js';
import { getGeneratedFileDefinitions, renderTemplate } from './templates.js';
import { createZip } from './zip.js';
import { validateGithubHandle } from './escape.js';

// Template memory cache
const templateCache = {};

// Current State
let currentFormData = {};
let currentFileDefs = [];
let activeFileIndex = 0;
let renderedFiles = []; // Array<{ path, content, helpEn, helpFr }>

// DOM Elements
const selectUiLang = document.getElementById('select-ui-lang');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const form = document.getElementById('repoready-form');
const inputOwner = document.getElementById('input-owner');
const ownerErrorMsg = document.getElementById('owner-error-msg');

const ecosystemNote = document.getElementById('ecosystem-note');
const zipWarningBanner = document.getElementById('zip-warning-banner');

const tabsContainer = document.getElementById('file-tabs');
const activeFilePathEl = document.getElementById('active-file-path');
const activeFileHelpEl = document.getElementById('active-file-help');
const codePreviewEl = document.getElementById('code-preview');

const btnCopy = document.getElementById('btn-copy');
const linkGithubCreate = document.getElementById('link-github-create');
const urlTooLongNote = document.getElementById('url-too-long-note');
const btnDownloadZip = document.getElementById('btn-download-zip');

/**
 * Updates UI labels based on current language.
 */
function updateUiLanguage() {
  const lang = getLanguage();
  if (selectUiLang) selectUiLang.value = lang;

  const idsToTranslate = [
    'appTitle', 'appTagline', 'disclaimerText', 'formHeading',
    'labelProject', 'labelOwner', 'labelDescription', 'labelEmail',
    'labelType', 'typeLibrary', 'typeApp', 'typeDocs', 'typeOther',
    'labelEcosystems', 'labelMaintainers', 'labelLicense', 'labelOutputLang',
    'langEn', 'langFr', 'langBoth', 'labelSponsor', 'previewHeading',
    'btnCopy', 'btnDownloadZip', 'btnCreateOnGithub', 'noteEmptyRepo',
    'noteUrlTooLong', 'helpHeader'
  ];

  for (const id of idsToTranslate) {
    const el = document.getElementById(`txt-${id}`);
    if (el) {
      el.textContent = t(id);
    }
  }

  if (ownerErrorMsg) {
    ownerErrorMsg.textContent = t('errorInvalidOwner');
  }

  if (ecosystemNote) {
    ecosystemNote.textContent = t('noteNoEcosystems');
  }

  // Refresh active help text
  renderActiveFilePreview();
}

/**
 * Extracts form data into a structured object.
 */
function readFormData() {
  const formData = new FormData(form);
  const ecosystems = [];
  const checkboxEls = form.querySelectorAll('input[name="ecosystem"]:checked');
  checkboxEls.forEach(cb => ecosystems.push(cb.value));

  return {
    project: (formData.get('project') || '').trim(),
    owner: (formData.get('owner') || '').trim(),
    description: (formData.get('description') || '').trim(),
    email: (formData.get('email') || '').trim(),
    projectType: formData.get('projectType') || 'library',
    ecosystems: ecosystems,
    maintainers: (formData.get('maintainers') || '').trim(),
    license: formData.get('license') || 'MIT',
    outputLanguage: formData.get('outputLanguage') || 'en',
    sponsor: (formData.get('sponsor') || '').trim()
  };
}

/**
 * Fetches template content from server with caching.
 */
async function fetchTemplateText(templateKey) {
  if (templateCache[templateKey]) {
    return templateCache[templateKey];
  }

  try {
    const response = await fetch(`./templates/${templateKey}.tpl`);
    if (!response.ok) {
      throw new Error(`Failed to load template ${templateKey}: ${response.statusText}`);
    }
    const text = await response.text();
    templateCache[templateKey] = text;
    return text;
  } catch (err) {
    console.error(err);
    return `[Error loading template ${templateKey}]`;
  }
}

/**
 * Renders all generated files asynchronously.
 */
async function updateGeneratedFiles() {
  currentFormData = readFormData();

  // Validate owner handle for inline UI feedback
  const isOwnerValid = !!(currentFormData.owner && validateGithubHandle(currentFormData.owner));
  if (currentFormData.owner && !isOwnerValid) {
    if (inputOwner) inputOwner.classList.add('invalid');
    if (ownerErrorMsg) {
      ownerErrorMsg.textContent = t('errorInvalidOwner');
      ownerErrorMsg.classList.remove('hidden');
    }
  } else {
    if (inputOwner) inputOwner.classList.remove('invalid');
    if (ownerErrorMsg) ownerErrorMsg.classList.add('hidden');
  }

  // Handle ecosystem note
  if (ecosystemNote) {
    if (!currentFormData.ecosystems || currentFormData.ecosystems.length === 0) {
      ecosystemNote.textContent = t('noteNoEcosystems');
      ecosystemNote.classList.remove('hidden');
    } else {
      ecosystemNote.classList.add('hidden');
    }
  }

  // Update ZIP warning banner for missing / invalid required fields
  const missingFields = [];
  const lang = getLanguage();
  if (!currentFormData.project) {
    missingFields.push(lang === 'fr' ? 'Nom du projet' : 'Project Name');
  }
  if (!currentFormData.owner) {
    missingFields.push(lang === 'fr' ? 'Propriétaire' : 'Owner');
  } else if (!isOwnerValid) {
    missingFields.push(lang === 'fr' ? 'Propriétaire (invalide)' : 'Owner (invalid)');
  }
  if (!currentFormData.email) {
    missingFields.push(lang === 'fr' ? 'E-mail de sécurité' : 'Security E-mail');
  }

  if (zipWarningBanner) {
    if (missingFields.length > 0) {
      zipWarningBanner.textContent = t('warningMissingFields') + missingFields.join(', ');
      zipWarningBanner.classList.remove('hidden');
    } else {
      zipWarningBanner.classList.add('hidden');
    }
  }

  currentFileDefs = getGeneratedFileDefinitions(currentFormData);

  if (activeFileIndex >= currentFileDefs.length) {
    activeFileIndex = 0;
  }

  const newRendered = [];
  for (const def of currentFileDefs) {
    const tplText = await fetchTemplateText(def.templateKey);
    const content = renderTemplate(tplText, currentFormData, {
      lang: def.lang === 'license' ? 'en' : def.lang,
      isYaml: def.isYaml
    });

    newRendered.push({
      path: def.path,
      content,
      helpEn: def.helpEn,
      helpFr: def.helpFr
    });
  }

  renderedFiles = newRendered;
  renderTabs();
  renderActiveFilePreview();
}

/**
 * Renders file navigation tabs.
 */
function renderTabs() {
  tabsContainer.innerHTML = '';

  currentFileDefs.forEach((def, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tab-btn ${index === activeFileIndex ? 'active' : ''}`;
    btn.textContent = def.path;
    btn.addEventListener('click', () => {
      activeFileIndex = index;
      renderTabs();
      renderActiveFilePreview();
    });
    tabsContainer.appendChild(btn);
  });
}

/**
 * Renders active file preview safely using textContent.
 */
function renderActiveFilePreview() {
  if (!renderedFiles || renderedFiles.length === 0) return;

  const currentFile = renderedFiles[activeFileIndex] || renderedFiles[0];
  if (!currentFile) return;

  // Render Path
  activeFilePathEl.textContent = currentFile.path;

  // Render Help text in current UI language
  const uiLang = getLanguage();
  activeFileHelpEl.textContent = uiLang === 'fr' ? currentFile.helpFr : currentFile.helpEn;

  // Render Preview using textContent strictly (no innerHTML!)
  codePreviewEl.textContent = currentFile.content;

  // Handle "Create on GitHub" Link Generation & Limit Check (~6000 chars)
  const isOwnerValid = currentFormData.owner && validateGithubHandle(currentFormData.owner);
  const isProjectValid = !!currentFormData.project;

  if (isOwnerValid && isProjectValid) {
    const owner = encodeURIComponent(currentFormData.owner);
    const repo = encodeURIComponent(currentFormData.project);
    const encodedContent = encodeURIComponent(currentFile.content);
    const githubUrl = `https://github.com/${owner}/${repo}/new/main?filename=${encodeURIComponent(currentFile.path)}&value=${encodedContent}`;

    if (githubUrl.length <= 6000) {
      linkGithubCreate.href = githubUrl;
      linkGithubCreate.classList.remove('hidden');
      urlTooLongNote.classList.add('hidden');
    } else {
      linkGithubCreate.classList.add('hidden');
      urlTooLongNote.classList.remove('hidden');
    }
  } else {
    linkGithubCreate.classList.add('hidden');
    urlTooLongNote.classList.add('hidden');
  }
}

/**
 * Copies active file content to clipboard.
 */
async function handleCopyContent() {
  const currentFile = renderedFiles[activeFileIndex];
  if (!currentFile) return;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(currentFile.content);
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = currentFile.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    const txtBtnCopy = document.getElementById('txt-btnCopy');
    const originalText = t('btnCopy');
    if (txtBtnCopy) txtBtnCopy.textContent = t('btnCopied');
    btnCopy.classList.add('btn-success-border');

    setTimeout(() => {
      if (txtBtnCopy) txtBtnCopy.textContent = originalText;
      btnCopy.classList.remove('btn-success-border');
    }, 2000);

  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

/**
 * Triggers ZIP download of all generated files.
 */
function handleDownloadZip() {
  if (!renderedFiles || renderedFiles.length === 0) return;

  const zipFiles = renderedFiles.map(f => ({
    path: f.path,
    content: f.content
  }));

  const zipBytes = createZip(zipFiles);
  const blob = new Blob([zipBytes], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);

  const safeProjectName = (currentFormData.project || 'repository')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-');

  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeProjectName}-community-files.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Initializes listeners and state.
 */
function init() {
  // UI Language Switcher Listener
  selectUiLang.addEventListener('change', (e) => {
    setLanguage(e.target.value);
    updateUiLanguage();
  });

  // Theme Toggle Listener
  btnThemeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
  });

  // Form input change listeners
  form.addEventListener('input', () => updateGeneratedFiles());
  form.addEventListener('change', () => updateGeneratedFiles());

  // Copy button listener
  btnCopy.addEventListener('click', handleCopyContent);

  // ZIP Download button listener
  btnDownloadZip.addEventListener('click', handleDownloadZip);

  // Initial render
  updateUiLanguage();
  updateGeneratedFiles();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
