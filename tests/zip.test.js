import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createZip, crc32 } from '../src/zip.js';

test('crc32 produces correct checksum', () => {
  const bytes = new TextEncoder().encode('Hello World');
  const checksum = crc32(bytes);
  // Standard IEEE 802.3 CRC32 for "Hello World" is 1243066710 (0x4A177056)
  assert.equal(checksum, 1243066710);
});

test('createZip generates valid ZIP archive verifiable by system unzip command', () => {
  const files = [
    { path: 'LICENSE', content: 'MIT License Content' },
    { path: 'CODE_OF_CONDUCT.md', content: '# Code of Conduct' },
    { path: '.github/dependabot.yml', content: 'version: 2\nupdates: []' }
  ];

  const zipBytes = createZip(files);
  assert.ok(zipBytes instanceof Uint8Array);
  assert.ok(zipBytes.length > 0);

  // Write temporary zip file to scratch directory
  const tmpDir = path.join(process.cwd(), '.test_tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const tmpZipPath = path.join(tmpDir, 'test.zip');
  fs.writeFileSync(tmpZipPath, zipBytes);

  try {
    // Run unzip -t (test archive integrity)
    const stdout = execSync(`unzip -t "${tmpZipPath}"`, { encoding: 'utf-8' });
    assert.ok(stdout.includes('No errors detected'));

    // List archive contents
    const listOut = execSync(`unzip -l "${tmpZipPath}"`, { encoding: 'utf-8' });
    assert.ok(listOut.includes('LICENSE'));
    assert.ok(listOut.includes('CODE_OF_CONDUCT.md'));
    assert.ok(listOut.includes('.github/dependabot.yml'));
  } finally {
    // Cleanup temporary zip file
    if (fs.existsSync(tmpZipPath)) {
      fs.unlinkSync(tmpZipPath);
    }
    if (fs.existsSync(tmpDir)) {
      fs.rmdirSync(tmpDir);
    }
  }
});
