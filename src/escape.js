/**
 * Security and Escaping Module for RepoReady
 * Pure JS, node-safe (no DOM operations at top-level).
 */

const GITHUB_HANDLE_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Validates a GitHub handle (username or organization name).
 * @param {string} handle 
 * @returns {boolean}
 */
export function validateGithubHandle(handle) {
  if (!handle || typeof handle !== 'string') return false;
  return GITHUB_HANDLE_REGEX.test(handle.trim());
}

/**
 * Validates a GitHub repository name.
 * @param {string} name 
 * @returns {boolean}
 */
export function validateRepoName(name) {
  if (!name || typeof name !== 'string') return false;
  return REPO_NAME_REGEX.test(name.trim());
}

/**
 * Escapes a string for safe insertion inside double-quoted YAML strings or scalar fields.
 * Handles newlines, double quotes, colons, hash symbols, YAML structural markers.
 * @param {string} str 
 * @returns {string}
 */
export function escapeYamlString(str) {
  if (str === null || str === undefined) return '';
  let val = String(str).trim();
  
  // Remove newlines for single-line YAML values
  val = val.replace(/[\r\n]+/g, ' ');
  
  // Replace double quotes with single quotes to avoid breaking unquoted or double-quoted surrounding text
  val = val.replace(/"/g, "'");

  // Prevent inline key mapping creation (e.g., 'key: val') by replacing ': ' with ' - '
  val = val.replace(/:\s+/g, ' - ');

  // Strip raw hash symbol to prevent inline YAML comment injection
  val = val.replace(/#/g, '');

  return val;
}

/**
 * Escapes user inputs before inserting into raw Markdown text to prevent header/list/comment injections.
 * @param {string} str 
 * @returns {string}
 */
export function escapeMarkdownString(str) {
  if (str === null || str === undefined) return '';
  let val = String(str);

  // Prevent inline HTML / script injection in markdown renderers
  val = val
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Neutralize block-level injection vectors at start of string or lines (like #, ---, >)
  // Replace leading # or --- or > on newlines
  val = val.replace(/(^|\n)(#+|\s*---|>\s*|\s*[-*+]\s+)/g, '$1\\$2');

  // Neutralize raw template syntax {{...}}
  val = val.replace(/\{\{/g, '{\\{').replace(/\}\}/g, '\\}\\}');

  return val;
}

/**
 * Sanitizes and formats a comma-separated list of GitHub handles into validated string or array.
 * @param {string} rawHandles 
 * @returns {{ valid: string[], invalid: string[] }}
 */
export function parseMaintainers(rawHandles) {
  if (!rawHandles || typeof rawHandles !== 'string') {
    return { valid: [], invalid: [] };
  }
  const parts = rawHandles.split(',').map(s => s.trim().replace(/^@/, '')).filter(Boolean);
  const valid = [];
  const invalid = [];

  for (const handle of parts) {
    if (validateGithubHandle(handle)) {
      valid.push(`@${handle}`);
    } else {
      invalid.push(handle);
    }
  }

  return { valid, invalid };
}

/**
 * HTML escaper utility for UI strings / attributes.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
