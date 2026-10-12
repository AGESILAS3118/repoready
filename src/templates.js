/**
 * Template Engine & File Renderer for RepoReady
 * Pure JS, node-safe module.
 */

import { escapeYamlString, escapeMarkdownString, parseMaintainers, validateGithubHandle } from './escape.js';

/**
 * Renders a template string by replacing {{var}} placeholders.
 * If a value is missing, inserts a visible marker like [TO COMPLETE: security e-mail].
 * 
 * @param {string} template 
 * @param {Object} data 
 * @param {Object} options { lang: 'en'|'fr', isYaml: boolean }
 * @returns {string} Rendered text
 */
export function renderTemplate(template, data = {}, options = {}) {
  if (!template || typeof template !== 'string') return '';
  const lang = options.lang === 'fr' ? 'fr' : 'en';
  const isYaml = !!options.isYaml;

  const currentYear = new Date().getFullYear().toString();

  // Field names mapping for markers
  const fieldNames = {
    en: {
      project: 'project name',
      owner: 'owner',
      email: 'security contact e-mail',
      year: 'year',
      description: 'project description',
      maintainers: 'maintainers',
      sponsor: 'sponsor handle'
    },
    fr: {
      project: 'nom du projet',
      owner: 'propriétaire',
      email: 'e-mail de sécurité',
      year: 'année',
      description: 'description du projet',
      maintainers: 'mainteneurs',
      sponsor: 'pseudo sponsor'
    }
  };

  const getMarker = (key) => {
    const name = fieldNames[lang][key] || key;
    return lang === 'fr' ? `[À COMPLÉTER : ${name}]` : `[TO COMPLETE: ${name}]`;
  };

  // Helper to format values safely
  const formatVal = (val, key) => {
    if (val === undefined || val === null || String(val).trim() === '') {
      const marker = getMarker(key);
      return isYaml ? escapeYamlString(marker) : marker;
    }
    const cleanStr = String(val).trim();
    if (isYaml) {
      return escapeYamlString(cleanStr);
    }
    return escapeMarkdownString(cleanStr);
  };

  // Process maintainers list
  let maintainersStr = '';
  const rawMaintainers = data.maintainers ? String(data.maintainers).trim() : '';
  const parsedMaintainers = parseMaintainers(rawMaintainers);

  if (parsedMaintainers.valid.length > 0) {
    maintainersStr = parsedMaintainers.valid.join(', ');
  } else if (rawMaintainers.length > 0) {
    maintainersStr = rawMaintainers;
  } else {
    maintainersStr = getMarker('maintainers');
  }

  // CODEOWNERS maintainer line
  let codeownersMaintainers = '';
  if (parsedMaintainers.valid.length > 0) {
    codeownersMaintainers = `* ${parsedMaintainers.valid.join(' ')}`;
  } else {
    codeownersMaintainers = lang === 'fr' ? '# [À COMPLÉTER : mainteneurs]' : '# [TO COMPLETE: maintainers]';
  }

  // Format ecosystems for dependabot.yml
  let ecosystemsYaml = '';
  if (data.ecosystems && Array.isArray(data.ecosystems) && data.ecosystems.length > 0) {
    ecosystemsYaml = data.ecosystems.map(eco => {
      const ecoVal = isYaml ? escapeYamlString(eco) : eco;
      return `  - package-ecosystem: "${ecoVal}"\n    directory: "/"\n    schedule:\n      interval: "weekly"`;
    }).join('\n');
  }

  const outputLang = data.outputLanguage || options.outputLanguage || 'en';
  const isBothFr = outputLang === 'both' && lang === 'fr';

  // Handle owner & project validity for URLs vs plain text
  const rawOwner = data.owner ? String(data.owner).trim() : '';
  const isOwnerValid = validateGithubHandle(rawOwner);

  const rawProject = data.project ? String(data.project).trim() : '';
  const isProjectValid = rawProject.length > 0;

  const ownerVal = data.owner ? formatVal(data.owner, 'owner') : getMarker('owner');

  // Contact links for config.yml: omit link entirely if owner or project is empty/invalid
  let contactLinksYaml = '';
  if (isOwnerValid && isProjectValid) {
    const ownerEnc = encodeURIComponent(rawOwner);
    const projEnc = encodeURIComponent(rawProject);
    const policyUrl = `https://github.com/${ownerEnc}/${projEnc}/security/policy`;
    const emailStr = data.email ? String(data.email).trim() : getMarker('email');
    const safeEmail = escapeYamlString(emailStr);

    if (outputLang === 'both') {
      contactLinksYaml = `contact_links:
  - name: "Security Vulnerabilities / Vulnérabilités de sécurité"
    url: "${policyUrl}"
    about: "Please report security vulnerabilities privately via our security policy or email ${safeEmail}. / Veuillez signaler les vulnérabilités de sécurité de manière privée via notre politique de sécurité ou par e-mail à ${safeEmail}."`;
    } else if (lang === 'fr') {
      contactLinksYaml = `contact_links:
  - name: "Vulnérabilités de sécurité"
    url: "${policyUrl}"
    about: "Veuillez signaler les vulnérabilités de sécurité de manière privée via notre politique de sécurité ou par e-mail à ${safeEmail}."`;
    } else {
      contactLinksYaml = `contact_links:
  - name: "Security Vulnerabilities"
    url: "${policyUrl}"
    about: "Please report security vulnerabilities privately via our security policy or email ${safeEmail}."`;
    }
  }

  const ownerMarkdown = isOwnerValid ? encodeURIComponent(rawOwner) : getMarker('owner');
  const projectMarkdown = isProjectValid ? escapeMarkdownString(rawProject) : getMarker('project');

  const values = {
    project: isYaml ? (data.project ? escapeYamlString(data.project) : formatVal(data.project, 'project')) : projectMarkdown,
    project_plain: data.project ? formatVal(data.project, 'project') : getMarker('project'),
    owner: isYaml ? (data.owner ? escapeYamlString(data.owner) : formatVal(data.owner, 'owner')) : ownerMarkdown,
    owner_plain: data.owner ? formatVal(data.owner, 'owner') : getMarker('owner'),
    email: formatVal(data.email, 'email'),
    year: data.year ? String(data.year).trim() : currentYear,
    description: formatVal(data.description, 'description'),
    maintainers: isYaml ? escapeYamlString(maintainersStr) : maintainersStr,
    codeowners_maintainers: codeownersMaintainers,
    sponsor: formatVal(data.sponsor, 'sponsor'),
    ecosystems_yaml: ecosystemsYaml,
    contact_links_yaml: contactLinksYaml,
    coc_file: isBothFr ? 'CODE_OF_CONDUCT.fr.md' : 'CODE_OF_CONDUCT.md',
    security_file: isBothFr ? 'SECURITY.fr.md' : 'SECURITY.md',
    contributing_file: isBothFr ? 'CONTRIBUTING.fr.md' : 'CONTRIBUTING.md',
    support_file: isBothFr ? 'SUPPORT.fr.md' : 'SUPPORT.md'
  };

  let rendered = template;
  for (const [key, val] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, val);
  }

  return rendered;
}

/**
 * Returns file list definitions based on output language preference.
 * 
 * @param {Object} formData 
 * @returns {Array<{ path: string, templateKey: string, category: string, lang: 'en'|'fr'|'license', isYaml: boolean, helpEn: string, helpFr: string }>}
 */
export function getGeneratedFileDefinitions(formData) {
  const outputLang = formData.outputLanguage || 'en'; // 'en', 'fr', 'both'
  const license = formData.license || 'MIT';
  const hasSponsor = !!(formData.sponsor && formData.sponsor.trim());
  const hasEcosystems = !!(formData.ecosystems && formData.ecosystems.length > 0);

  const defs = [];

  // 1. LICENSE (always English in templates/licenses/)
  defs.push({
    path: 'LICENSE',
    templateKey: `licenses/${license}`,
    lang: 'license',
    isYaml: false,
    helpEn: 'The legal license for your repository. Placed at the root directory.',
    helpFr: 'La licence juridique de votre dépôt. Placée à la racine du projet.'
  });

  // Helper to push EN file
  const addEnFiles = () => {
    defs.push(
      {
        path: 'CODE_OF_CONDUCT.md',
        templateKey: 'en/CODE_OF_CONDUCT',
        lang: 'en',
        isYaml: false,
        helpEn: 'Sets community standards and reporting process. Placed at the root directory.',
        helpFr: 'Définit les règles de conduite de la communauté. Placé à la racine.'
      },
      {
        path: 'CONTRIBUTING.md',
        templateKey: 'en/CONTRIBUTING',
        lang: 'en',
        isYaml: false,
        helpEn: 'Guidelines for contributors on how to report bugs and send PRs. Placed at the root.',
        helpFr: 'Guide d\'aide à la contribution pour signaler des bogues et soumettre des PR. Placé à la racine.'
      },
      {
        path: 'SECURITY.md',
        templateKey: 'en/SECURITY',
        lang: 'en',
        isYaml: false,
        helpEn: 'Instructions for responsibly disclosing security vulnerabilities. Placed at the root.',
        helpFr: 'Consignes de divulgation responsable des vulnérabilités. Placé à la racine.'
      },
      {
        path: 'SUPPORT.md',
        templateKey: 'en/SUPPORT',
        lang: 'en',
        isYaml: false,
        helpEn: 'Overview of support resources and community channels. Placed at the root.',
        helpFr: 'Présentation des canaux d\'assistance et de la documentation. Placé à la racine.'
      },
      {
        path: '.github/ISSUE_TEMPLATE/bug_report.yml',
        templateKey: 'en/bug_report',
        lang: 'en',
        isYaml: true,
        helpEn: 'Structured GitHub Issue Form for bug reports. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire structuré d\'issue GitHub pour signaler des bogues. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: '.github/ISSUE_TEMPLATE/feature_request.yml',
        templateKey: 'en/feature_request',
        lang: 'en',
        isYaml: true,
        helpEn: 'Structured GitHub Issue Form for feature suggestions. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire structuré d\'issue GitHub pour suggérer des fonctionnalités. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: '.github/ISSUE_TEMPLATE/config.yml',
        templateKey: 'en/config',
        lang: 'en',
        isYaml: true,
        helpEn: 'Configures security contact link for issue creation page. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Configure le lien de contact sécurité sur la page de création d\'issues. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: '.github/PULL_REQUEST_TEMPLATE.md',
        templateKey: 'en/PULL_REQUEST_TEMPLATE',
        lang: 'en',
        isYaml: false,
        helpEn: 'Default description and checklist auto-filled when opening PRs. Placed in .github/.',
        helpFr: 'Modèle de description et liste de contrôle lors de la création d\'une PR. Placé dans .github/.'
      },
      {
        path: '.github/CODEOWNERS',
        templateKey: 'en/CODEOWNERS',
        lang: 'en',
        isYaml: false,
        helpEn: 'Automatically requests reviews from maintainers for pull requests. Placed in .github/.',
        helpFr: 'Demande automatiquement la relecture des mainteneurs lors des PR. Placé dans .github/.'
      }
    );

    if (hasEcosystems) {
      defs.push({
        path: '.github/dependabot.yml',
        templateKey: 'en/dependabot',
        lang: 'en',
        isYaml: true,
        helpEn: 'Configures automated weekly dependency security update checks. Placed in .github/.',
        helpFr: 'Configure la vérification hebdomadaire automatique des dépendances. Placé dans .github/.'
      });
    }

    if (hasSponsor) {
      defs.push({
        path: '.github/FUNDING.yml',
        templateKey: 'en/FUNDING',
        lang: 'en',
        isYaml: true,
        helpEn: 'Adds a Sponsor button to your GitHub repository header. Placed in .github/.',
        helpFr: 'Ajoute un bouton de soutien (Sponsor) en haut de votre dépôt GitHub. Placé dans .github/.'
      });
    }
  };

  // Helper to push FR files
  const addFrFiles = (isSuffix = false) => {
    const s = isSuffix ? '.fr.md' : '.md';
    const ymlSuffix = isSuffix ? '_fr.yml' : '.yml';

    defs.push(
      {
        path: `CODE_OF_CONDUCT${s}`,
        templateKey: 'fr/CODE_OF_CONDUCT',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French Code of Conduct for community participation. Placed at the root directory.',
        helpFr: 'Code de conduite en français pour la communauté. Placé à la racine.'
      },
      {
        path: `CONTRIBUTING${s}`,
        templateKey: 'fr/CONTRIBUTING',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French contribution guidelines for community members. Placed at the root.',
        helpFr: 'Guide de contribution en français. Placé à la racine.'
      },
      {
        path: `SECURITY${s}`,
        templateKey: 'fr/SECURITY',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French security policy disclosure guide. Placed at the root.',
        helpFr: 'Politique de sécurité en français. Placé à la racine.'
      },
      {
        path: `SUPPORT${s}`,
        templateKey: 'fr/SUPPORT',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French support resources guide. Placed at the root.',
        helpFr: 'Guide des ressources de support en français. Placé à la racine.'
      },
      {
        path: `.github/ISSUE_TEMPLATE/bug_report${ymlSuffix}`,
        templateKey: 'fr/bug_report',
        lang: 'fr',
        isYaml: true,
        helpEn: 'French bug report GitHub Issue Form. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire d\'issue GitHub pour rapport de bogue en français. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: `.github/ISSUE_TEMPLATE/feature_request${ymlSuffix}`,
        templateKey: 'fr/feature_request',
        lang: 'fr',
        isYaml: true,
        helpEn: 'French feature request GitHub Issue Form. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire d\'issue GitHub pour demande de fonctionnalité en français. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: `.github/ISSUE_TEMPLATE/config${ymlSuffix}`,
        templateKey: 'fr/config',
        lang: 'fr',
        isYaml: true,
        helpEn: 'French Issue Form configuration. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Configuration du formulaire d\'issues en français. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: `.github/PULL_REQUEST_TEMPLATE${s}`,
        templateKey: 'fr/PULL_REQUEST_TEMPLATE',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French PR description template. Placed in .github/.',
        helpFr: 'Modèle de Pull Request en français. Placé dans .github/.'
      }
    );

    if (!isSuffix) {
      defs.push({
        path: '.github/CODEOWNERS',
        templateKey: 'fr/CODEOWNERS',
        lang: 'fr',
        isYaml: false,
        helpEn: 'Automatically requests reviews from maintainers. Placed in .github/.',
        helpFr: 'Demande automatiquement la relecture des mainteneurs. Placé dans .github/.'
      });

      if (hasEcosystems) {
        defs.push({
          path: '.github/dependabot.yml',
          templateKey: 'fr/dependabot',
          lang: 'fr',
          isYaml: true,
          helpEn: 'Automated weekly dependency security checks. Placed in .github/.',
          helpFr: 'Vérification automatique hebdomadaire des dépendances. Placé dans .github/.'
        });
      }

      if (hasSponsor) {
        defs.push({
          path: '.github/FUNDING.yml',
          templateKey: 'fr/FUNDING',
          lang: 'fr',
          isYaml: true,
          helpEn: 'Sponsor button configuration. Placed in .github/.',
          helpFr: 'Configuration du bouton Sponsor. Placé dans .github/.'
        });
      }
    }
  };

  if (outputLang === 'en') {
    addEnFiles();
  } else if (outputLang === 'fr') {
    addFrFiles(false);
  } else if (outputLang === 'both') {
    // In both mode:
    // Root markdown files in both EN and FR (.fr.md)
    defs.push(
      {
        path: 'CODE_OF_CONDUCT.md',
        templateKey: 'en/CODE_OF_CONDUCT',
        lang: 'en',
        isYaml: false,
        helpEn: 'Sets community standards and reporting process. Placed at the root directory.',
        helpFr: 'Définit les règles de conduite de la communauté. Placé à la racine.'
      },
      {
        path: 'CONTRIBUTING.md',
        templateKey: 'en/CONTRIBUTING',
        lang: 'en',
        isYaml: false,
        helpEn: 'Guidelines for contributors on how to report bugs and send PRs. Placed at the root.',
        helpFr: 'Guide d\'aide à la contribution pour signaler des bogues et soumettre des PR. Placé dans la racine.'
      },
      {
        path: 'SECURITY.md',
        templateKey: 'en/SECURITY',
        lang: 'en',
        isYaml: false,
        helpEn: 'Instructions for responsibly disclosing security vulnerabilities. Placed at the root.',
        helpFr: 'Consignes de divulgation responsable des vulnérabilités. Placé à la racine.'
      },
      {
        path: 'SUPPORT.md',
        templateKey: 'en/SUPPORT',
        lang: 'en',
        isYaml: false,
        helpEn: 'Overview of support resources and community channels. Placed at the root.',
        helpFr: 'Présentation des canaux d\'assistance et de la documentation. Placé à la racine.'
      },
      {
        path: 'CODE_OF_CONDUCT.fr.md',
        templateKey: 'fr/CODE_OF_CONDUCT',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French Code of Conduct for community participation. Placed at the root directory.',
        helpFr: 'Code de conduite en français pour la communauté. Placé à la racine.'
      },
      {
        path: 'CONTRIBUTING.fr.md',
        templateKey: 'fr/CONTRIBUTING',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French contribution guidelines for community members. Placed at the root.',
        helpFr: 'Guide de contribution en français. Placé à la racine.'
      },
      {
        path: 'SECURITY.fr.md',
        templateKey: 'fr/SECURITY',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French security policy disclosure guide. Placed at the root.',
        helpFr: 'Politique de sécurité en français. Placé à la racine.'
      },
      {
        path: 'SUPPORT.fr.md',
        templateKey: 'fr/SUPPORT',
        lang: 'fr',
        isYaml: false,
        helpEn: 'French support resources guide. Placed at the root.',
        helpFr: 'Guide des ressources de support en français. Placé à la racine.'
      },
      // Issue templates: English + French issue forms
      {
        path: '.github/ISSUE_TEMPLATE/bug_report.yml',
        templateKey: 'en/bug_report',
        lang: 'en',
        isYaml: true,
        helpEn: 'Structured GitHub Issue Form for bug reports. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire structuré d\'issue GitHub pour signaler des bogues. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: '.github/ISSUE_TEMPLATE/feature_request.yml',
        templateKey: 'en/feature_request',
        lang: 'en',
        isYaml: true,
        helpEn: 'Structured GitHub Issue Form for feature suggestions. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire structuré d\'issue GitHub pour suggérer des fonctionnalités. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: '.github/ISSUE_TEMPLATE/bug_report_fr.yml',
        templateKey: 'fr/bug_report',
        lang: 'fr',
        isYaml: true,
        helpEn: 'French bug report GitHub Issue Form. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire d\'issue GitHub pour rapport de bogue en français. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: '.github/ISSUE_TEMPLATE/feature_request_fr.yml',
        templateKey: 'fr/feature_request',
        lang: 'fr',
        isYaml: true,
        helpEn: 'French feature request GitHub Issue Form. Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Formulaire d\'issue GitHub pour demande de fonctionnalité en français. Placé dans .github/ISSUE_TEMPLATE/.'
      },
      // ONE single bilingual config.yml and ONE single bilingual PULL_REQUEST_TEMPLATE.md
      {
        path: '.github/ISSUE_TEMPLATE/config.yml',
        templateKey: 'both/config',
        lang: 'en',
        isYaml: true,
        helpEn: 'Configures security contact link for issue creation page (Bilingual). Placed in .github/ISSUE_TEMPLATE/.',
        helpFr: 'Configure le lien de contact sécurité sur la page de création d\'issues (Bilingue). Placé dans .github/ISSUE_TEMPLATE/.'
      },
      {
        path: '.github/PULL_REQUEST_TEMPLATE.md',
        templateKey: 'both/PULL_REQUEST_TEMPLATE',
        lang: 'en',
        isYaml: false,
        helpEn: 'Default description and checklist auto-filled when opening PRs (Bilingual). Placed in .github/.',
        helpFr: 'Modèle de description et liste de contrôle lors de la création d\'une PR (Bilingue). Placé dans .github/.'
      },
      {
        path: '.github/CODEOWNERS',
        templateKey: 'en/CODEOWNERS',
        lang: 'en',
        isYaml: false,
        helpEn: 'Automatically requests reviews from maintainers for pull requests. Placed in .github/.',
        helpFr: 'Demande automatiquement la relecture des mainteneurs lors des PR. Placé dans .github/.'
      }
    );

    if (hasEcosystems) {
      defs.push({
        path: '.github/dependabot.yml',
        templateKey: 'en/dependabot',
        lang: 'en',
        isYaml: true,
        helpEn: 'Configures automated weekly dependency security update checks. Placed in .github/.',
        helpFr: 'Configure la vérification hebdomadaire automatique des dépendances. Placé dans .github/.'
      });
    }

    if (hasSponsor) {
      defs.push({
        path: '.github/FUNDING.yml',
        templateKey: 'en/FUNDING',
        lang: 'en',
        isYaml: true,
        helpEn: 'Adds a Sponsor button to your GitHub repository header. Placed in .github/.',
        helpFr: 'Ajoute un bouton de soutien (Sponsor) en haut de votre dépôt GitHub. Placé dans .github/.'
      });
    }
  }

  return defs;
}
