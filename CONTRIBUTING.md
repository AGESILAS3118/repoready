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

## Code of Conduct

This project is governed by the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report any unacceptable behavior responsibly.

## Reporting a Bug / Signaler un bogue

- Before opening a new issue, please search existing issues to see if the bug was already reported.
- To report a bug, use our official GitHub Issue Form: go to the **Issues** tab and click **New Issue** > **Bug Report** (or use `.github/ISSUE_TEMPLATE/bug_report.yml`).
- Include precise steps to reproduce, expected behavior, and browser/Node environment details.

## Submitting a Pull Request / Proposer une Pull Request

1. **Fork & Branch**: Fork the repository and create a feature branch off `main` (e.g. `git checkout -b feature/my-enhancement`).
2. **Follow Standards**:
   - Zero runtime dependencies: keep core logic in pure vanilla JavaScript.
   - Maintain strict CSP compatibility: no inline styles or external resources.
3. **Run Tests**: Ensure all automated tests pass before opening a PR:
   ```bash
   npm test
   ```
4. **Commit & PR**: Write clear, descriptive commit messages (following conventional commit prefixes such as `fix:`, `feat:`, `docs:`) and reference any related issue.

