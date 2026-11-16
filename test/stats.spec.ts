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

  it('should handle real-device timelines without simStarted', function () {
    const realDevice = {
      events: {
        xcodeDetailsRetrieved: [1000],
        appInstalled: [3000],
        wdaStartAttempted: [5000],
        wdaSessionAttempted: [8000],
        wdaSessionStarted: [10500],
      },
    };
    const [all, avgs, stdevs] = computeXcuitestStats([realDevice]);
    assert.deepEqual(all, [
      {
        simStartLength: null,
        wdaStartLength: 3,
        wdaSessionStartLength: 2.5,
        numWdaStartAttempts: 1,
        numWdaSessionAttempts: 1,
      },
    ]);
    assert.equal(avgs.simStartLength, null);
    assert.equal(stdevs.simStartLength, null);
    assert.equal(avgs.wdaStartLength, 3);
    assert.equal(avgs.wdaSessionStartLength, 2.5);
  });

  it('should ignore null stats when aggregating mixed runs', function () {
    const realDevice = {
      events: {
        xcodeDetailsRetrieved: [1000],
        wdaSessionAttempted: [3000],
        wdaSessionStarted: [4500],
      },
    };
    const [, avgs, stdevs] = computeXcuitestStats([fixture, realDevice]);
    assert.equal(avgs.simStartLength, 2);
    assert.equal(stdevs.simStartLength, 0);
    assert.equal(avgs.wdaStartLength, 3.5);
    assert.equal(avgs.wdaSessionStartLength, 1.5);
  });
});
