import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {Timeline} from '../lib/timeline.js';

describe('Timeline.fromData', function () {
  it('should return an empty timeline for empty data', function () {
    assert.deepEqual(Timeline.fromData({}).events, []);
  });

  it('should sort events and normalize time to the first event', function () {
    assert.deepEqual(Timeline.fromData({b: [150, 300], a: [100]}).events, [
      ['a', 0],
      ['b', 50],
      ['b', 200],
    ]);
  });

  it('should skip commands and entries marked with iterate=false', function () {
    assert.deepEqual(Timeline.fromData({a: [1], commands: [5], custom: {iterate: false}}).events, [['a', 0]]);
  });
});

describe('Timeline#render', function () {
  it('should print events and gap durations', function () {
    const lines = new Timeline([
      ['a', 0],
      ['b', 1000],
      ['c', 10000],
    ]).render(10);
    assert.ok(lines.some((l) => l.includes('a@0s')));
    assert.ok(lines.some((l) => l.includes('(9s)')));
    assert.ok(lines[lines.length - 1].includes('c@10s'));
  });

  it('should return no lines for an empty timeline', function () {
    assert.deepEqual(new Timeline([]).render(), []);
  });

  it('should not fail on a single-event timeline', function () {
    const lines = new Timeline([['a', 0]]).render(10);
    assert.ok(lines[0].includes('a@0s'));
  });
});
