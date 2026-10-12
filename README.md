# RepoReady 🚀

**Make your repo community-ready in 2 minutes, in English or French.**  
*Rends ton dépôt prêt pour la communauté en 2 minutes, en anglais ou en français.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20Runtime-brightgreen.svg)]()
[![Zero Network Requests](https://img.shields.io/badge/Network-0%20Runtime%20Calls-success.svg)]()

---

## English Documentation

### What is RepoReady?
RepoReady is a free, 100% client-side web tool (hosted on GitHub Pages) that generates all the essential community health files every GitHub repository needs (`LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `.github/ISSUE_TEMPLATE/*.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/FUNDING.yml`), in English, French, or both — with zero command line required.

### Features
- ⚡ **Instant Client-Side Generation**: 100% browser-based. Zero backend, zero database, zero tracking, zero runtime network requests.
- 🌍 **Bilingual EN/FR**: UI auto-detection from browser language with persistent manual switcher (`localStorage`). When "both" language mode is selected, a single bilingual `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/config.yml` are generated because GitHub only recognizes a single default PR template and a single issue config.
- 🔐 **Security First**: Strict Content Security Policy (`<meta>` CSP). Input sanitization preventing YAML line/key injections and Markdown corruption.
- 📦 **Native ZIP Downloader**: Custom pure JS Store-method ZIP builder with CRC-32 (no third-party runtime libraries).
- 🚀 **GitHub Direct Integration**: Direct "Create on GitHub" links pre-filled with generated content (for URLs under ~6000 characters).
- 🎨 **Responsive & Accessible**: Light/dark theme according to system preferences, keyboard navigation, and semantic HTML labels.

> 🛡️ **Security**: If you discover a vulnerability, please report it privately via [GitHub Private Vulnerability Reporting](https://github.com/AGESILAS3118/repoready/security/advisories/new) according to our [Security Policy](SECURITY.md).

### How to Use RepoReady in 3 Steps
1. **Fill in your repository details**: Enter your project name, GitHub handle/organization, license choice, and select your preferred output language (English, French, or Both).
2. **Review generated files in real-time**: Use the interactive tabs to inspect your customized community files, issue forms, and PR templates.
3. **Export and apply**: Click **Download ZIP Archive** to extract the files straight into your repository root, or use **Create on GitHub** to commit them directly through the browser.

### Local Development & Testing

> ⚠️ **Important Notice**: When testing locally, `index.html` **must be served over an HTTP server** (e.g., using `python3 -m http.server`). Opening `index.html` directly via the `file://` protocol will prevent the browser from loading template files (`*.tpl`) due to browser CORS/fetch security restrictions.

```bash
# Clone repository
git clone https://github.com/AGESILAS3118/repoready.git
cd repoready

# Start local HTTP server
python3 -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

### Running Automated Tests
Tests use the Node.js native test runner (`node:test`):

```bash
npm test
```

---

## Documentation en Français

### Qu'est-ce que RepoReady ?
RepoReady est un outil web gratuit et 100 % côté client (hébergé sur GitHub Pages) qui génère en quelques clics tous les fichiers de communauté indispensables à un dépôt GitHub professionnel (`LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `.github/ISSUE_TEMPLATE/*.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/FUNDING.yml`), en anglais, en français ou dans les deux langues — sans aucune ligne de commande.

### Fonctionnalités
- ⚡ **Génération côté client instantanée** : Tout fonctionne dans votre navigateur. Aucun serveur, aucune base de données, aucun suivi, zéro requête réseau à l'exécution.
- 🌍 **Bilingue EN/FR** : Détection automatique de la langue du navigateur et mémorisation du choix (`localStorage`). En mode bilingue (« both »), un fichier unique bilingue `.github/PULL_REQUEST_TEMPLATE.md` et `.github/ISSUE_TEMPLATE/config.yml` est généré, GitHub ne prenant en compte qu'un seul modèle de PR par défaut et une seule configuration d'issues.
- 🔐 **Sécurité renforcée** : Balise CSP stricte. Échappement rigoureux des entrées utilisateur pour éviter toute injection dans les fichiers YAML ou Markdown.
- 📦 **Téléchargement ZIP natif** : Générateur ZIP pur JS (méthode Store + contrôle de clé CRC-32 sans aucune dépendance externe).
- 🚀 **Lien direct « Créer sur GitHub »** : Préréglage automatique dans l'éditeur de fichiers GitHub pour les fichiers courts.
- 🎨 **Responsive & Accessible** : Thème clair/sombre adaptatif, navigation au clavier et étiquettes accessibles.

> 🛡️ **Sécurité** : Si vous découvrez une vulnérabilité, merci de la signaler de manière privée via le [signalement privé GitHub](https://github.com/AGESILAS3118/repoready/security/advisories/new), conformément à notre [Politique de sécurité](SECURITY.md).

### Comment utiliser RepoReady en 3 étapes
1. **Renseignez les informations de votre projet** : Indiquez le nom du projet, votre identifiant ou organisation GitHub, la licence souhaitée et la langue des fichiers (Anglais, Français ou Les deux).
2. **Vérifiez les fichiers générés en temps réel** : Parcourez les onglets interactifs pour relire vos fichiers de communauté, formulaires d'issues et modèles de PR personnalisés.
3. **Exportez et appliquez** : Cliquez sur **Télécharger le ZIP** pour extraire l'arborescence directement à la racine de votre dépôt, ou sur **Créer sur GitHub** pour les ajouter directement via l'interface web.

### Développement local et tests

> ⚠️ **Remarque importante** : Pour les tests locaux, le fichier `index.html` **doit être servi via un serveur HTTP** (par exemple avec `python3 -m http.server`). L'ouverture directe de `index.html` via le protocole `file://` empêche le chargement des fichiers de modèles (`*.tpl`) en raison des règles de sécurité CORS des navigateurs.

```bash
# Lancer un serveur HTTP local
python3 -m http.server 8000
```
Ouvrez `http://localhost:8000` dans votre navigateur.

---

### Project Structure / Structure du projet

```text
RepoReady/
├── index.html                      # Main web UI and layout / Interface web principale
├── style.css                       # Vanilla CSS design system / Feuille de styles moderne
├── package.json                    # Project metadata & test scripts / Métadonnées et scripts
├── .nojekyll                       # GitHub Pages Jekyll bypass / Contournement Jekyll Pages
├── LICENSE                         # MIT License / Licence du projet
├── CONTRIBUTING.md                 # Contribution guidelines / Guide de contribution
├── SECURITY.md                     # Security policy / Politique de sécurité
├── SUPPORT.md                      # Community support channels / Canaux d'assistance
├── NEEDS_REVIEW.md                 # Translation audit log / Journal d'audit des gabarits
├── NOTICE                          # Attributions and notices / Mentions légales et attributions
├── .github/                        # GitHub community configuration / Configuration GitHub
│   ├── CODEOWNERS                  # Repository maintainer ownership / Propriétaires du code
│   ├── dependabot.yml              # Automated security updates / Configuration Dependabot
│   ├── PULL_REQUEST_TEMPLATE.md    # Pull Request template / Modèle de Pull Request
│   └── ISSUE_TEMPLATE/             # Issue forms & config / Formulaires d'issues GitHub
│       ├── bug_report.yml          # Bug report form / Formulaire de signalement de bogue
│       ├── feature_request.yml     # Feature suggestion form / Formulaire de fonctionnalité
│       └── config.yml              # Issue form security link / Configuration des issues
├── src/                            # Client-side core logic / Logique client pure
│   ├── app.js                      # Application state and DOM glue / Gestionnaire d'état et DOM
│   ├── templates.js                # Template rendering engine / Moteur de rendu des templates
│   ├── zip.js                      # Pure JS ZIP builder (Store + CRC-32) / Générateur ZIP natif
│   ├── escape.js                   # Sanitization (YAML & Markdown) / Fonctions d'échappement
│   └── i18n.js                     # Language switcher & strings / Module d'internationalisation
├── templates/                      # Source templates (*.tpl) / Gabarits sources
│   ├── licenses/                   # Official open-source licenses / Licences officielles
│   ├── en/                         # English community templates / Modèles en anglais
│   ├── fr/                         # French community templates / Modèles en français
│   └── both/                       # Bilingual files (PR template, config.yml) / Fichiers bilingues
├── i18n/                           # Localized UI bundles / Chaînes de l'interface (en.json, fr.json)
└── tests/                          # Automated tests (node:test) / Suite de tests automatisés
```

---

## How to Contribute a Translation / Comment contribuer une traduction

We welcome contributions to translations and new templates!

1. **UI Translations**:
   - English strings: [`i18n/en.json`](i18n/en.json)
   - French strings: [`i18n/fr.json`](i18n/fr.json)
2. **Template Files**:
   - English templates: [`templates/en/`](templates/en/)
   - French templates: [`templates/fr/`](templates/fr/)
   - Official license texts: [`templates/licenses/`](templates/licenses/)
3. **French Template Review**:
   - Every French template is documented in [`NEEDS_REVIEW.md`](NEEDS_REVIEW.md) for human proofreading and community feedback.

---

## License

RepoReady is licensed under the [MIT License](LICENSE).

