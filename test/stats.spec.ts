import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, it} from 'node:test';

import {computeXcuitestStats} from '../lib/stats.js';

const fixture = JSON.parse(readFileSync(new URL('../../test/fixtures/events.json', import.meta.url), 'utf8'));

describe('computeXcuitestStats', function () {
  it('should compute stats, averages and deviations', function () {
    const [all, avgs, stdevs] = computeXcuitestStats([fixture, fixture.events]);
    const expected = {
      simStartLength: 2,
      wdaStartLength: 5,
      wdaSessionStartLength: 1.5,
      numWdaStartAttempts: 2,
      numWdaSessionAttempts: 1,
    };
    assert.deepEqual(all, [expected, expected]);
    assert.deepEqual(avgs, expected);
    assert.deepEqual(stdevs, Object.fromEntries(Object.keys(expected).map((k) => [k, 0])));
  });

  it('should use the population standard deviation', function () {
    const slower = {...fixture.events, simStarted: [5000]};
    const [, avgs, stdevs] = computeXcuitestStats([fixture, slower]);
    // simStartLength is 2s and 4s
    assert.equal(avgs.simStartLength, 3);
    assert.equal(stdevs.simStartLength, 1);
  });
});
