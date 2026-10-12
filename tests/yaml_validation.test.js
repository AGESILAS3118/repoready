import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { renderTemplate, getGeneratedFileDefinitions } from '../src/templates.js';

test('every generated YAML file parses cleanly with YAML parser even with hostile inputs', () => {
  const testCases = [];
  const modes = ['en', 'fr', 'both'];

  const scenarios = [
    // (a) Fully EMPTY form
    {},
    // (b) owner "Agésilas"
    {
      owner: 'Agésilas',
      project: 'TestApp',
      email: 'test@example.com'
    },
    // (c) project name "Mon Projet: test #1"
    {
      project: 'Mon Projet: test #1',
      owner: 'octocat',
      email: 'test@example.com'
    },
    // Existing hostile inputs
    {
      project: 'Project: "Extreme" # Hostile & -- Special',
      owner: 'user-name',
      email: 'sec@test.com',
      year: '2026',
      description: 'Desc with \n newlines and: "quotes" # comments',
      maintainers: 'user-name, @other-user',
      license: 'MIT',
      ecosystems: ['npm', 'pip', 'docker', 'cargo'],
      sponsor: 'user-name'
    }
  ];

  for (const mode of modes) {
    for (const scenario of scenarios) {
      testCases.push({ ...scenario, outputLanguage: mode });
    }
  }

  for (const formData of testCases) {
    const fileDefs = getGeneratedFileDefinitions(formData);
    const yamlDefs = fileDefs.filter(d => d.isYaml);

    assert.ok(yamlDefs.length > 0, 'Must have YAML file definitions');

    for (const def of yamlDefs) {
      const tplPath = path.join(process.cwd(), 'templates', `${def.templateKey}.tpl`);
      const tplContent = fs.readFileSync(tplPath, 'utf-8');
      const rendered = renderTemplate(tplContent, formData, { lang: def.lang, isYaml: def.isYaml });

      // Must parse without throwing syntax errors
      try {
        const parsed = YAML.parse(rendered);
        assert.ok(parsed !== undefined && parsed !== null, `Parsed YAML in ${def.path} should not be null/undefined`);
      } catch (err) {
        assert.fail(`Failed to parse generated YAML for ${def.path}:\nError: ${err.message}\nRendered Output:\n${rendered}`);
      }
    }
  }
});
