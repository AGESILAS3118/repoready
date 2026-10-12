# Contributing to RepoReady

Thank you for contributing to RepoReady! We welcome contributions to UI features, bug fixes, and translations.

## How to Contribute a Translation / Guide de Traduction

RepoReady supports English and French out of the box. To improve or add translations:

1. **UI Strings**: Update `i18n/en.json` or `i18n/fr.json` (and `src/i18n.js` embedded strings).
2. **Community Templates**:
   - English templates are located in `templates/en/`.
   - French templates are located in `templates/fr/`.
   - Official license texts are in `templates/licenses/`.
3. If modifying French templates, remember to update `NEEDS_REVIEW.md` for human proofreading log.

## Local Development & Testing

Since RepoReady uses native ES modules and fetches template files (`*.tpl`), it must be served over HTTP during local development (opening `index.html` via `file://` will be blocked by browser CORS/fetch rules):

```bash
# Start local HTTP server
python3 -m http.server 8000
```
Open `http://localhost:8000` in your browser.

## Running Tests

RepoReady uses the Node.js native test runner (`node:test`):

```bash
npm test
```
All unit tests verify input escaping, YAML parsing validity, ZIP archive generation, and unreplaced template variables.
