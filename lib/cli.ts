#!/usr/bin/env node

import {glob, lstat, readFile} from 'node:fs/promises';
import path from 'node:path';
import {inspect} from 'node:util';

import {asyncmap} from 'asyncbox';
import {Command} from 'commander';

import {computeXcuitestStats} from './stats.js';
import {Timeline, type EventData} from './timeline.js';

const READ_CONCURRENCY = 10;
// globs skip dot-prefixed names unless the pattern starts with a dot
const JSON_GLOBS = ['*.json', '.*.json', '.json'];

interface CliOptions {
  input: string;
  lines: number;
  timeline?: boolean;
  stats?: boolean;
}

async function readJson(file: string): Promise<EventData> {
  // strip a leading BOM, as require() did
  return JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
}

async function run({input, lines, timeline: showTimeline, stats: showStats}: CliOptions): Promise<void> {
  const data: EventData[] = [];
  if ((await lstat(input)).isDirectory()) {
    const files: string[] = [];
    for await (const file of glob(JSON_GLOBS, {cwd: input})) {
      files.push(file);
    }
    // asyncmap keeps the input order
    data.push(
      ...(await asyncmap(files.sort(), (file) => readJson(path.resolve(input, file)), {concurrency: READ_CONCURRENCY})),
    );
  } else {
    data.push(await readJson(path.resolve(input)));
  }
  if (!data.length) {
    throw new Error(`No .json files found in ${input}`);
  }
  if (showTimeline) {
    if (data.length > 1) {
      throw new Error('timeline can only have one json file');
    }
    Timeline.fromData(data[0].events || data[0]).print(lines);
    return;
  }
  if (showStats) {
    const [, avgs, stdevs] = computeXcuitestStats(data);
    process.stdout.write(`${inspect({avgs, stdevs})}\n`);
    return;
  }
  throw new Error('Use -t to print a timeline or -s to print stats');
}

const program = new Command()
  .name('appium-event-parser')
  .description('Parse Appium event timings')
  .requiredOption('-i, --input <path>', 'path to an input .json file or a directory of them')
  .option('-l, --lines <number>', 'number of timeline lines', (v) => parseInt(v, 10), 50)
  .option('-t, --timeline', 'print a timeline of the events')
  .option('-s, --stats', 'print XCUITest stats')
  // ignore unknown flags, as minimist did
  .allowUnknownOption()
  .allowExcessArguments()
  .action(run);

try {
  await program.parseAsync();
} catch (err) {
  process.stderr.write(`${(err as Error).message}\n`);
  process.exitCode = 1;
}
