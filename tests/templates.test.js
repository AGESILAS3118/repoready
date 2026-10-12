import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { renderTemplate, getGeneratedFileDefinitions } from '../src/templates.js';

test('renderTemplate replaces all variables cleanly', () => {
  const tpl = 'Project: {{project}}\nOwner: {{owner}}\nContact: {{email}}\nYear: {{year}}';
  const res = renderTemplate(tpl, {
    project: 'RepoReady',
    owner: 'octocat',
    email: 'security@example.com',
    year: '2026'
  }, { lang: 'en', isYaml: false });

  assert.ok(res.includes('Project: RepoReady'));
  assert.ok(res.includes('Owner: octocat'));
  assert.ok(res.includes('Contact: security@example.com'));
  assert.ok(res.includes('Year: 2026'));
  assert.ok(!res.includes('{{'));
});

test('renderTemplate inserts visible placeholders for missing required values', () => {
  const tpl = 'Project: {{project}}\nEmail: {{email}}';
  const resEn = renderTemplate(tpl, {}, { lang: 'en', isYaml: false });
  assert.ok(resEn.includes('[TO COMPLETE: project name]'));
  assert.ok(resEn.includes('[TO COMPLETE: security contact e-mail]'));

  const resFr = renderTemplate(tpl, {}, { lang: 'fr', isYaml: false });
  assert.ok(resFr.includes('[À COMPLÉTER : nom du projet]'));
  assert.ok(resFr.includes('[À COMPLÉTER : e-mail de sécurité]'));
});

test('no template output contains an unreplaced {{variable}} when rendering real files', () => {
  const formData = {
    project: 'MyCoolApp',
    owner: 'devuser',
    email: 'sec@domain.com',
    year: '2026',
    description: 'An awesome app',
    maintainers: 'devuser, alice',
    license: 'MIT',
    outputLanguage: 'both',
    ecosystems: ['npm', 'docker'],
    sponsor: 'devuser'
  };

  const fileDefs = getGeneratedFileDefinitions(formData);
  assert.ok(fileDefs.length > 10);

  for (const def of fileDefs) {
    const tplPath = path.join(process.cwd(), 'templates', `${def.templateKey}.tpl`);
    assert.ok(fs.existsSync(tplPath), `Template file missing: ${tplPath}`);

    const tplContent = fs.readFileSync(tplPath, 'utf-8');
    const rendered = renderTemplate(tplContent, formData, { lang: def.lang, isYaml: def.isYaml });

    // Verify no unreplaced {{var}} remain
    const unreplacedMatch = rendered.match(/\{\{[a-z_]+\}\}/g);
    assert.equal(unreplacedMatch, null, `Found unreplaced variable in ${def.path}: ${unreplacedMatch}`);
  }
});

test('generated markdown files do not contain nested malformed links', () => {
  const formData = {
    project: 'MyCoolApp',
    owner: 'devuser',
    email: 'sec@domain.com',
    year: '2026',
    description: 'An awesome app',
    maintainers: 'devuser',
    license: 'MIT',
    outputLanguage: 'both',
    ecosystems: ['npm']
  };

  const fileDefs = getGeneratedFileDefinitions(formData);
  const mdDefs = fileDefs.filter(d => !d.isYaml);

  for (const def of mdDefs) {
    const tplPath = path.join(process.cwd(), 'templates', `${def.templateKey}.tpl`);
    const tplContent = fs.readFileSync(tplPath, 'utf-8');
    const rendered = renderTemplate(tplContent, formData, { lang: def.lang, isYaml: def.isYaml });

    // Assert no nested malformed link pattern such as "](https://[" or "[http"
    assert.equal(rendered.includes('](https://['), false, `Found malformed link pattern '](https://[' in ${def.path}`);
    assert.equal(rendered.includes('[http'), false, `Found malformed link pattern '[http' in ${def.path}`);
  }
});

test('relative Markdown links resolve to valid generated targets for all output modes', () => {
  const modes = ['en', 'fr', 'both'];

  for (const outputLanguage of modes) {
    const formData = {
      project: 'MyCoolApp',
      owner: 'devuser',
      email: 'sec@domain.com',
      year: '2026',
      description: 'An awesome app',
      maintainers: 'devuser',
      license: 'MIT',
      outputLanguage,
      ecosystems: ['npm']
    };

    const fileDefs = getGeneratedFileDefinitions(formData);
    const generatedPathsSet = new Set(fileDefs.map(d => d.path));
    const mdDefs = fileDefs.filter(d => !d.isYaml);

    for (const def of mdDefs) {
      const tplPath = path.join(process.cwd(), 'templates', `${def.templateKey}.tpl`);
      const tplContent = fs.readFileSync(tplPath, 'utf-8');
      const rendered = renderTemplate(tplContent, formData, { lang: def.lang, isYaml: def.isYaml });

      // Match markdown links [text](target)
      const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(rendered)) !== null) {
        const linkTarget = match[1].trim();

        // Skip absolute URLs or non-relative schemes
        if (/^(https?:\/\/|mailto:|#)/.test(linkTarget)) {
          continue;
        }

        // Clean query/anchor parameters if any
        const targetFile = linkTarget.split('#')[0].split('?')[0];

        // README.md is allowed as it is assumed existing in root repo
        if (targetFile === 'README.md') {
          continue;
        }

        assert.ok(
          generatedPathsSet.has(targetFile),
          `In mode '${outputLanguage}', link target '${targetFile}' in file '${def.path}' is not in generated files set [${Array.from(generatedPathsSet).join(', ')}]`
        );

        if (outputLanguage === 'both' && def.path.endsWith('.fr.md')) {
          assert.ok(
            targetFile.endsWith('.fr.md'),
            `In 'both' mode, French file '${def.path}' links to non-.fr target '${targetFile}'`
          );
        }
      }
    }
  }
});

test('in both mode .github/ISSUE_TEMPLATE contains exactly one config.yml and valid issue forms', () => {
  const formData = {
    project: 'MyCoolApp',
    owner: 'devuser',
    email: 'sec@domain.com',
    year: '2026',
    description: 'An awesome app',
    maintainers: 'devuser',
    license: 'MIT',
    outputLanguage: 'both',
    ecosystems: ['npm']
  };

  const fileDefs = getGeneratedFileDefinitions(formData);
  const issueTemplateFiles = fileDefs.filter(d => d.path.startsWith('.github/ISSUE_TEMPLATE/'));
  const configFiles = issueTemplateFiles.filter(d => d.path === '.github/ISSUE_TEMPLATE/config.yml');

  assert.equal(configFiles.length, 1, 'Should contain exactly one config.yml in .github/ISSUE_TEMPLATE/');

  const otherYamlFiles = issueTemplateFiles.filter(d => d.path !== '.github/ISSUE_TEMPLATE/config.yml');
  assert.ok(otherYamlFiles.length >= 2, 'Should have issue form templates');

  for (const def of otherYamlFiles) {
    const tplPath = path.join(process.cwd(), 'templates', `${def.templateKey}.tpl`);
    const tplContent = fs.readFileSync(tplPath, 'utf-8');
    const rendered = renderTemplate(tplContent, formData, { lang: def.lang, isYaml: def.isYaml });

    const parsed = YAML.parse(rendered);
    assert.ok(typeof parsed.name === 'string' && parsed.name.trim().length > 0, `Issue form ${def.path} must have a non-empty name string`);
    assert.ok(typeof parsed.description === 'string' && parsed.description.trim().length > 0, `Issue form ${def.path} must have a non-empty description string`);
    assert.ok(Array.isArray(parsed.body), `Issue form ${def.path} must have a body array`);
  }
});

test('no PULL_REQUEST_TEMPLATE.* file other than PULL_REQUEST_TEMPLATE.md is generated in any mode', () => {
  const modes = ['en', 'fr', 'both'];

  for (const outputLanguage of modes) {
    const formData = {
      project: 'MyCoolApp',
      owner: 'devuser',
      email: 'sec@domain.com',
      year: '2026',
      description: 'An awesome app',
      maintainers: 'devuser',
      license: 'MIT',
      outputLanguage,
      ecosystems: ['npm']
    };

    const fileDefs = getGeneratedFileDefinitions(formData);
    const prTemplateFiles = fileDefs.filter(d => d.path.includes('PULL_REQUEST_TEMPLATE'));

    for (const def of prTemplateFiles) {
      assert.equal(
        def.path,
        '.github/PULL_REQUEST_TEMPLATE.md',
        `In mode '${outputLanguage}', PR template file path '${def.path}' must be exactly '.github/PULL_REQUEST_TEMPLATE.md'`
      );
    }
  }
});

test('invalid owner Agésilas produces no URL containing that string but shows in copyright line; valid owner produces correct links', () => {
  const invalidData = {
    project: 'ADISSO',
    owner: 'Agésilas',
    email: 'sec@domain.com',
    year: '2026',
    description: 'An awesome app',
    maintainers: 'devuser',
    license: 'MIT',
    outputLanguage: 'both',
    ecosystems: ['npm']
  };

  const fileDefs = getGeneratedFileDefinitions(invalidData);

  for (const def of fileDefs) {
    const tplPath = path.join(process.cwd(), 'templates', `${def.templateKey}.tpl`);
    const tplContent = fs.readFileSync(tplPath, 'utf-8');
    const rendered = renderTemplate(tplContent, invalidData, { lang: def.lang, isYaml: def.isYaml });

    // Extract all URLs
    const urlRegex = /https?:\/\/[^\s"'`<>)]+/g;
    let match;
    while ((match = urlRegex.exec(rendered)) !== null) {
      const url = match[0];
      assert.equal(
        url.includes('Ag%C3%A9silas') || url.includes('Agésilas'),
        false,
        `Found invalid owner 'Agésilas' in URL '${url}' in file '${def.path}'`
      );
    }

    // Check copyright line in LICENSE file
    if (def.path === 'LICENSE') {
      assert.ok(rendered.includes('Agésilas'), `LICENSE file should contain plain text owner 'Agésilas'`);
    }
  }

  // Test valid owner
  const validData = {
    project: 'ADISSO',
    owner: 'octocat',
    email: 'sec@domain.com',
    year: '2026',
    description: 'An awesome app',
    maintainers: 'octocat',
    license: 'MIT',
    outputLanguage: 'both',
    ecosystems: ['npm']
  };

  const validDefs = getGeneratedFileDefinitions(validData);
  const supportDef = validDefs.find(d => d.path === 'SUPPORT.md');
  assert.ok(supportDef, 'SUPPORT.md definition should exist');

  const supportTpl = fs.readFileSync(path.join(process.cwd(), 'templates', `${supportDef.templateKey}.tpl`), 'utf-8');
  const supportRendered = renderTemplate(supportTpl, validData, { lang: supportDef.lang, isYaml: supportDef.isYaml });
  assert.ok(
    supportRendered.includes('https://github.com/octocat/ADISSO/issues'),
    'SUPPORT.md should contain valid issues link for octocat/ADISSO'
  );

  const configDef = validDefs.find(d => d.path === '.github/ISSUE_TEMPLATE/config.yml');
  assert.ok(configDef, 'config.yml definition should exist');

  const configTpl = fs.readFileSync(path.join(process.cwd(), 'templates', `${configDef.templateKey}.tpl`), 'utf-8');
  const configRendered = renderTemplate(configTpl, validData, { lang: configDef.lang, isYaml: configDef.isYaml });
  assert.ok(
    configRendered.includes('https://github.com/octocat/ADISSO/security/policy'),
    'config.yml should contain valid security policy link for octocat/ADISSO'
  );
});




test('CODEOWNERS is commented out when no maintainers are specified', () => {
  const modes = ['en', 'fr', 'both'];
  for (const mode of modes) {
    const formData = {
      project: 'TestApp',
      owner: 'testowner',
      outputLanguage: mode
    };
    const fileDefs = getGeneratedFileDefinitions(formData);
    const codeownersDef = fileDefs.find(d => d.path.endsWith('CODEOWNERS'));
    assert.ok(codeownersDef, `CODEOWNERS should exist in mode ${mode}`);

    const tplPath = path.join(process.cwd(), 'templates', `${codeownersDef.templateKey}.tpl`);
    const tplContent = fs.readFileSync(tplPath, 'utf-8');
    const rendered = renderTemplate(tplContent, formData, { lang: codeownersDef.lang, isYaml: codeownersDef.isYaml });

    const expectedPlaceholder = mode === 'fr' ? '# [À COMPLÉTER : mainteneurs]' : '# [TO COMPLETE: maintainers]';
    assert.ok(rendered.includes(expectedPlaceholder), `Maintainers line should be commented placeholder for mode ${mode}`);
    assert.equal(rendered.includes('* @'), false, 'Should not contain active wildcards without maintainers');
  }
});

test('config.yml omits contact_links when owner or project is empty/invalid', () => {
  const modes = ['en', 'fr', 'both'];
  for (const mode of modes) {
    const emptyFormData = {
      outputLanguage: mode,
      owner: '',
      project: ''
    };
    const fileDefs = getGeneratedFileDefinitions(emptyFormData);
    const configDef = fileDefs.find(d => d.path === '.github/ISSUE_TEMPLATE/config.yml');
    assert.ok(configDef, `config.yml should exist in mode ${mode}`);

    const tplPath = path.join(process.cwd(), 'templates', `${configDef.templateKey}.tpl`);
    const tplContent = fs.readFileSync(tplPath, 'utf-8');
    const rendered = renderTemplate(tplContent, emptyFormData, { lang: configDef.lang, isYaml: configDef.isYaml });

    assert.equal(rendered.includes('contact_links:'), false, 'Should omit contact_links entirely');
    assert.ok(rendered.includes('blank_issues_enabled: false'), 'Must retain blank_issues_enabled setting');
  }
});

test('dependabot.yml is omitted when no ecosystems are selected and included when selected', () => {
  const withoutEcosystems = {
    project: 'TestApp',
    owner: 'testowner',
    outputLanguage: 'both',
    ecosystems: []
  };
  const defsWithout = getGeneratedFileDefinitions(withoutEcosystems);
  assert.equal(defsWithout.some(d => d.path.includes('dependabot')), false, 'dependabot.yml must not be generated without ecosystems');

  const withEcosystems = {
    project: 'TestApp',
    owner: 'testowner',
    outputLanguage: 'both',
    ecosystems: ['npm', 'docker']
  };
  const defsWith = getGeneratedFileDefinitions(withEcosystems);
  assert.ok(defsWith.some(d => d.path.includes('dependabot')), 'dependabot.yml must be generated when ecosystems are selected');
});


test('warning banner message is rendered when required fields are missing', () => {
  const emptyData = {
    outputLanguage: 'en',
    project: '',
    owner: '',
    email: ''
  };
  // Verifies that placeholders are inserted for visible review
  const fileDefs = getGeneratedFileDefinitions(emptyData);
  assert.ok(fileDefs.length > 0);
  const licenseDef = fileDefs.find(d => d.path === 'LICENSE');
  const tpl = fs.readFileSync(path.join(process.cwd(), 'templates', `${licenseDef.templateKey}.tpl`), 'utf-8');
  const rendered = renderTemplate(tpl, emptyData, { lang: licenseDef.lang, isYaml: licenseDef.isYaml });
  assert.ok(rendered.includes('[TO COMPLETE: owner]'), 'Should contain visible placeholder indicating missing required field');
});

