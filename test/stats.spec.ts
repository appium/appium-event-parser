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
    const avgAttempts: number = avgs.numWdaStartAttempts;
    const stdevAttempts: number = stdevs.numWdaSessionAttempts;
    assert.equal(avgAttempts, 2);
    assert.equal(stdevAttempts, 0);
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
        wdaStartLength: null,
        wdaSessionStartLength: 2.5,
        numWdaStartAttempts: 1,
        numWdaSessionAttempts: 1,
      },
    ]);
    assert.equal(avgs.simStartLength, null);
    assert.equal(stdevs.simStartLength, null);
    assert.equal(avgs.wdaStartLength, null);
    assert.equal(stdevs.wdaStartLength, null);
    assert.equal(avgs.wdaSessionStartLength, 2.5);
  });

  it('should return null lengths when no anchor events exist', function () {
    const [all, avgs, stdevs] = computeXcuitestStats([{events: {}}]);
    assert.deepEqual(all, [
      {
        simStartLength: null,
        wdaStartLength: null,
        wdaSessionStartLength: null,
        numWdaStartAttempts: 0,
        numWdaSessionAttempts: 0,
      },
    ]);
    assert.deepEqual(avgs, {
      simStartLength: null,
      wdaStartLength: null,
      wdaSessionStartLength: null,
      numWdaStartAttempts: 0,
      numWdaSessionAttempts: 0,
    });
    assert.deepEqual(stdevs, {
      simStartLength: null,
      wdaStartLength: null,
      wdaSessionStartLength: null,
      numWdaStartAttempts: 0,
      numWdaSessionAttempts: 0,
    });
  });

  it('should return null wda lengths when wdaSessionAttempted is absent', function () {
    const partial = {
      events: {
        xcodeDetailsRetrieved: [1000],
        simStarted: [3000],
        wdaStartAttempted: [4000],
      },
    };
    const [all, avgs, stdevs] = computeXcuitestStats([partial]);
    assert.deepEqual(all, [
      {
        simStartLength: 2,
        wdaStartLength: null,
        wdaSessionStartLength: null,
        numWdaStartAttempts: 1,
        numWdaSessionAttempts: 0,
      },
    ]);
    assert.equal(avgs.simStartLength, 2);
    assert.equal(stdevs.simStartLength, 0);
    assert.equal(avgs.wdaStartLength, null);
    assert.equal(stdevs.wdaStartLength, null);
    assert.equal(avgs.wdaSessionStartLength, null);
    assert.equal(stdevs.wdaSessionStartLength, null);
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
    assert.equal(avgs.wdaStartLength, 5);
    assert.equal(stdevs.wdaStartLength, 0);
    assert.equal(avgs.wdaSessionStartLength, 1.5);
  });
});
