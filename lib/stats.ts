import {Timeline, type EventData} from './timeline.js';

export type XcuitestStat = {
  simStartLength: number | null;
  wdaStartLength: number | null;
  wdaSessionStartLength: number | null;
  numWdaStartAttempts: number;
  numWdaSessionAttempts: number;
};

const MILLIS_PER_SECOND = 1000;

export type XcuitestStatSummary = {
  [K in keyof XcuitestStat]: null extends XcuitestStat[K] ? number | null : number;
};

const NULLABLE_STAT_KEYS = ['simStartLength', 'wdaStartLength', 'wdaSessionStartLength'] as const;
const COUNT_STAT_KEYS = ['numWdaStartAttempts', 'numWdaSessionAttempts'] as const;

/** Computes per-dataset XCUITest stats along with their averages and standard deviations. */
export function computeXcuitestStats(
  dataSets: EventData[],
): [allStats: XcuitestStat[], avgs: XcuitestStatSummary, stdevs: XcuitestStatSummary] {
  // each set may be a full session capabilities object with an events key, or just the event data
  const allStats = dataSets.map((set) => XcuitestTimeline.fromData(set.events || set).stats());
  const summarize = (aggregate: (vals: number[]) => number): XcuitestStatSummary => {
    const pick = (key: keyof XcuitestStat) =>
      allStats.map((s) => s[key]).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    const [simStartLength, wdaStartLength, wdaSessionStartLength] = NULLABLE_STAT_KEYS.map((key) => {
      const vals = pick(key);
      return vals.length ? aggregate(vals) : null;
    });
    const [numWdaStartAttempts, numWdaSessionAttempts] = COUNT_STAT_KEYS.map((key) => {
      const vals = pick(key);
      return vals.length ? aggregate(vals) : 0;
    });
    return {
      simStartLength,
      wdaStartLength,
      wdaSessionStartLength,
      numWdaStartAttempts,
      numWdaSessionAttempts,
    };
  };
  return [allStats, summarize(mean), summarize(stdev)];
}

/** Computes XCUITest stats for a single timeline. */
class XcuitestTimeline extends Timeline {
  stats(): XcuitestStat {
    const simStartMs = this.evtTimeBetween('xcodeDetailsRetrieved', 'simStarted');
    const wdaStartMs = this.evtTimeBetween('simStarted', 'wdaSessionAttempted');
    const wdaSessionStartMs = this.evtTimeBetween('wdaSessionAttempted', 'wdaSessionStarted');

    return {
      simStartLength: simStartMs !== null ? simStartMs / MILLIS_PER_SECOND : null,
      wdaStartLength: wdaStartMs !== null ? wdaStartMs / MILLIS_PER_SECOND : null,
      wdaSessionStartLength: wdaSessionStartMs !== null ? wdaSessionStartMs / MILLIS_PER_SECOND : null,
      numWdaStartAttempts: this.count('wdaStartAttempted'),
      numWdaSessionAttempts: this.count('wdaSessionAttempted'),
    };
  }

  private evtTime(evt: string): number | null {
    const match = this.events.find((e) => e[0] === evt);
    return match ? match[1] : null;
  }

  private evtTimeBetween(evt1: string, evt2: string): number | null {
    const t1 = this.evtTime(evt1);
    const t2 = this.evtTime(evt2);
    if (t1 === null || t2 === null) {
      return null;
    }
    return t2 - t1;
  }

  private count(evt: string): number {
    return this.events.filter((e) => e[0] === evt).length;
  }
}

function mean(vals: number[]): number {
  return vals.reduce((acc, v) => acc + v, 0) / vals.length;
}

/** Population standard deviation. */
function stdev(vals: number[]): number {
  const avg = mean(vals);
  return Math.sqrt(mean(vals.map((v) => (v - avg) ** 2)));
}
