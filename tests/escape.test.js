import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeYamlString,
  escapeMarkdownString,
  validateGithubHandle,
  validateRepoName,
  parseMaintainers
} from '../src/escape.js';

test('validateGithubHandle accepts valid usernames and handles', () => {
  assert.equal(validateGithubHandle('octocat'), true);
  assert.equal(validateGithubHandle('user-123'), true);
  assert.equal(validateGithubHandle('a'), true);
  assert.equal(validateGithubHandle('-invalid'), false);
  assert.equal(validateGithubHandle('invalid-'), false);
  assert.equal(validateGithubHandle('invalid--user'), false);
  assert.equal(validateGithubHandle('user@name'), false);
  assert.equal(validateGithubHandle('user name'), false);
});

test('validateRepoName accepts valid repository names', () => {
  assert.equal(validateRepoName('my-awesome-repo'), true);
  assert.equal(validateRepoName('RepoReady_v0.1'), true);
  assert.equal(validateRepoName('repo.js'), true);
  assert.equal(validateRepoName('repo name'), false);
  assert.equal(validateRepoName('repo/name'), false);
});

test('escapeYamlString safely handles hostile input', () => {
  const hostile1 = 'My Project: "Dangerous" # comment \n--- key: val';
  const escaped1 = escapeYamlString(hostile1);
  // Quotes turned to single quotes, colon replaced, newlines stripped, comment stripped
  assert.ok(!escaped1.includes('"'));
  assert.ok(!escaped1.includes('#'));
  assert.ok(!escaped1.includes('\n'));
  assert.ok(escaped1.includes("'Dangerous'"));
});

test('escapeMarkdownString neutralizes script tags and headers', () => {
  const hostile = '<script>alert("xss")</script>\n# Injected Header\n{{injected_var}}';
  const escaped = escapeMarkdownString(hostile);
  assert.ok(!escaped.includes('<script>'));
  assert.ok(escaped.includes('&lt;script&gt;'));
  assert.ok(escaped.includes('\\# Injected Header'));
  assert.ok(escaped.includes('{\\{injected_var\\}\\}'));
});

test('parseMaintainers separates valid handles from invalid ones', () => {
  const res = parseMaintainers('@alice, bob, invalid username, @charlie-1');
  assert.deepEqual(res.valid, ['@alice', '@bob', '@charlie-1']);
  assert.deepEqual(res.invalid, ['invalid username']);
});
