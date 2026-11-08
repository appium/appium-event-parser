import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const CLI = fileURLToPath(new URL('../lib/cli.js', import.meta.url));
const FIXTURE = fileURLToPath(new URL('../../test/fixtures/events.json', import.meta.url));
const EMPTY = fileURLToPath(new URL('../../test/fixtures/empty.json', import.meta.url));
const BOM = fileURLToPath(new URL('../../test/fixtures/bom.json', import.meta.url));
const run = promisify(execFile);

describe('cli', function () {
  it('should fail without an input', async function () {
    await assert.rejects(run(process.execPath, [CLI]), /required option '-i, --input <path>' not specified/);
  });

  it('should fail without -t or -s', async function () {
    await assert.rejects(run(process.execPath, [CLI, '-i', FIXTURE]), /Use -t to print a timeline/);
  });

  it('should ignore unknown flags', async function () {
    const {stdout} = await run(process.execPath, [CLI, '-t', '-i', FIXTURE, '--foo']);
    assert.match(stdout, /xcodeDetailsRetrieved@0s/);
  });

  it('should print a clean error without a stack trace', async function () {
    await assert.rejects(run(process.execPath, [CLI, '-t', '-i', '/nonexistent.json']), (err: any) => {
      assert.equal(err.code, 1);
      assert.doesNotMatch(err.stderr, /\n\s+at /);
      return true;
    });
  });

  it('should print a timeline', async function () {
    const {stdout} = await run(process.execPath, [CLI, '-t', '-i', FIXTURE]);
    assert.match(stdout, /xcodeDetailsRetrieved@0s/);
    assert.match(stdout, /wdaSessionStarted@8.5s/);
  });

  it('should print nothing for a timeline without events', async function () {
    const {stdout} = await run(process.execPath, [CLI, '-t', '-i', EMPTY]);
    assert.equal(stdout, '');
  });

  it('should accept JSON files with a leading BOM', async function () {
    const {stdout} = await run(process.execPath, [CLI, '-t', '-i', BOM]);
    assert.match(stdout, /xcodeDetailsRetrieved@0s/);
  });

  it('should fail for a directory without JSON files', async function () {
    const dir = await mkdtemp(path.join(tmpdir(), 'event-parser-'));
    try {
      await assert.rejects(run(process.execPath, [CLI, '-t', '-i', dir]), /No \.json files found/);
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  });

  it('should include dot-prefixed JSON files from a directory', async function () {
    const dir = await mkdtemp(path.join(tmpdir(), 'event-parser-'));
    try {
      const events = JSON.parse(await readFile(FIXTURE, 'utf8'));
      // simStartLength is 2s and 4s
      await writeFile(path.join(dir, 'visible.json'), JSON.stringify(events));
      await writeFile(
        path.join(dir, '.session.json'),
        JSON.stringify({events: {...events.events, simStarted: [5000]}}),
      );
      const {stdout} = await run(process.execPath, [CLI, '-s', '-i', dir]);
      assert.match(stdout, /simStartLength: 3/);
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  });

  it('should print stats', async function () {
    const {stdout} = await run(process.execPath, [CLI, '-s', '-i', FIXTURE]);
    assert.match(stdout, /simStartLength: 2/);
  });
});
