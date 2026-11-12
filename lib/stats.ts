import {Timeline, type EventData} from './timeline.js';

export type XcuitestStat = {
  simStartLength: number;
  wdaStartLength: number;
  wdaSessionStartLength: number;
  numWdaStartAttempts: number;
  numWdaSessionAttempts: number;
};

/** Computes per-dataset XCUITest stats along with their averages and standard deviations. */
export function computeXcuitestStats(
  dataSets: EventData[],
): [allStats: XcuitestStat[], avgs: Record<string, number>, stdevs: Record<string, number>] {
  // each set may be a full session capabilities object with an events key, or just the event data
  const allStats = dataSets.map((set) => XcuitestTimeline.fromData(set.events || set).stats());
  const avgs: Record<string, number> = {};
  const stdevs: Record<string, number> = {};
  for (const key of Object.keys(allStats[0] ?? {}) as (keyof XcuitestStat)[]) {
    const vals = allStats.map((s) => s[key]);
    avgs[key] = mean(vals);
    stdevs[key] = stdev(vals);
  }
  return [allStats, avgs, stdevs];
}

/** Computes XCUITest stats for a single timeline. */
class XcuitestTimeline extends Timeline {
  stats(): XcuitestStat {
    return {
      simStartLength: this.evtTimeBetween('xcodeDetailsRetrieved', 'simStarted') / 1000,
      wdaStartLength: this.evtTimeBetween('simStarted', 'wdaSessionAttempted') / 1000,
      wdaSessionStartLength: this.evtTimeBetween('wdaSessionAttempted', 'wdaSessionStarted') / 1000,
      numWdaStartAttempts: this.count('wdaStartAttempted'),
      numWdaSessionAttempts: this.count('wdaSessionAttempted'),
    };
  }

  private evtTime(evt: string): number {
    return this.events.filter((e) => e[0] === evt)[0][1];
  }

  private evtTimeBetween(evt1: string, evt2: string): number {
    return this.evtTime(evt2) - this.evtTime(evt1);
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
