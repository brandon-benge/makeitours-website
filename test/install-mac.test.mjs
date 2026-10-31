import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'install-mac.sh');

// Runs the installer with PATH limited to stubs, so no real git, Xcode
// installer, Homebrew installer or network download can be reached.
function run(t, gitStub) {
  const bin = mkdtempSync(join(tmpdir(), 'mio-install-'));
  t.after(() => rmSync(bin, { recursive: true, force: true }));
  const stub = (name, body) => {
    writeFileSync(join(bin, name), `#!/bin/bash\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  for (const tool of ['awk', 'head']) symlinkSync(`/usr/bin/${tool}`, join(bin, tool));
  stub('uname', 'echo Darwin');
  stub('sw_vers', 'echo 15.1');
  stub('brew', 'echo "Homebrew 4.4.0"');
  stub('python3.13', 'echo "Python 3.13.1"');
  stub('xcode-select', `echo "$*" >> "${join(bin, 'xcode-select.log')}"`);
  stub('curl', `echo curl >> "${join(bin, 'network.log')}"; exit 1`);
  if (gitStub !== null) stub('git', gitStub);
  const result = spawnSync('/bin/bash', [script], { env: { PATH: bin, HOME: bin }, encoding: 'utf8' });
  const log = name => (existsSync(join(bin, name)) ? readFileSync(join(bin, name), 'utf8') : '');
  return { ...result, xcodeSelect: log('xcode-select.log'), network: log('network.log') };
}

test('missing git starts the developer-tools setup and exits nonzero', t => {
  const result = run(t, null);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /git not found/);
  assert.equal(result.xcodeSelect.trim(), '--install');
  assert.doesNotMatch(result.stdout, /✓\x1b\[0m git/);
  assert.doesNotMatch(result.stdout, /Done\./);
  assert.equal(result.network, '');
});

test('git that is found but cannot run is not reported as installed', t => {
  const result = run(t, 'echo "xcrun: error: invalid active developer path" >&2; exit 1');
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /git is installed but does not run/);
  assert.equal(result.xcodeSelect.trim(), '--install');
  assert.doesNotMatch(result.stdout, /✓\x1b\[0m git/);
  assert.doesNotMatch(result.stdout, /dependencies are installed/);
  assert.equal(result.network, '');
});

test('git that exits 0 without a version is not reported as installed', t => {
  const result = run(t, 'exit 0');
  assert.notEqual(result.status, 0);
  assert.equal(result.xcodeSelect.trim(), '--install');
  assert.doesNotMatch(result.stdout, /dependencies are installed/);
});

test('working git is reported with its version and setup completes', t => {
  const result = run(t, 'echo "git version 2.39.5 (Apple Git-154)"');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /✓\x1b\[0m git 2\.39\.5\n/);
  assert.match(result.stdout, /dependencies are installed/);
  assert.equal(result.xcodeSelect, '');
  assert.equal(result.network, '');
});
