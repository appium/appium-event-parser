export type EventTuple = [name: string, time: number];

/** Raw event data: event name -> list of timestamps (or custom metadata). */
export type EventData = Record<string, any>;

/** A time-sorted list of events, with the first event at time 0. */
export class Timeline {
  constructor(readonly events: EventTuple[]) {}

  /** Flattens raw event data into a normalized timeline. */
  static fromData<T extends Timeline>(this: new (events: EventTuple[]) => T, data: EventData): T {
    const absEvents: EventTuple[] = [];
    for (const eventType of Object.keys(data).filter((k) => k !== 'commands' && data[k].iterate !== false)) {
      for (const eventTime of data[eventType]) {
        absEvents.push([eventType, eventTime]);
      }
    }

    if (!absEvents.length) {
      return new this([]);
    }

    absEvents.sort((a, b) => a[1] - b[1]);

    const firstEventTime = absEvents[0][1];
    return new this(absEvents.map(([name, time]) => [name, time - firstEventTime]));
  }

  /** Renders the timeline as text lines, bucketed into `lines` slices, with gaps shown as durations. */
  render(lines = 200): string[] {
    if (!this.events.length) {
      return [];
    }
    const slices = this.bucket(lines);
    const gaps = this.findGaps(slices);
    const printLines = slices.map((slice, i) => {
      const gap = gaps.get(i);
      if (gap !== undefined) {
        return `(${gap / 1000}s)`;
      }
      if (slice.length) {
        return `[${slice.map(([evt, time]) => `${evt}@${time / 1000}s`).join(', ')}]`;
      }
      return '|';
    });
    const widestLineWidth = Math.max(0, ...printLines.map((l) => l.length));

    // center
    return printLines.map((line) => `${' '.repeat(Math.floor((widestLineWidth - line.length) / 2))}${line}`);
  }

  print(lines = 200): void {
    const rendered = this.render(lines);
    if (rendered.length) {
      process.stdout.write(`${rendered.join('\n')}\n`);
    }
  }

  /** Splits events into `lines` + 1 time slices. */
  private bucket(lines: number): EventTuple[][] {
    const msPerLine = this.events[this.events.length - 1][1] / lines;
    const slices: EventTuple[][] = Array.from({length: lines + 2}, () => []);
    for (const [evt, time] of this.events) {
      // zero-length timelines would divide by zero
      slices[msPerLine ? Math.ceil(time / msPerLine) : 0].push([evt, time]);
    }

    // make sure we don't end up with an empty slice at the end
    if (!slices[slices.length - 1].length) {
      slices.pop();
    }
    return slices;
  }

  /**
   * Maps the midpoint slice of each gap to the gap duration. A gap starts where
   * a populated slice is followed by an empty one, and ends at the next populated one.
   */
  private findGaps(slices: EventTuple[][]): Map<number, number> {
    const bounds: [number, number][][] = [];
    for (let i = 0, j = 1; j < slices.length; i++, j++) {
      const cur = slices[i];
      const next = slices[j];
      if (cur.length && !next.length) {
        bounds.push([[i, cur[cur.length - 1][1]]]);
      }
      if (!cur.length && next.length) {
        bounds[bounds.length - 1].push([j, next[0][1]]);
      }
    }

    const gaps = new Map<number, number>();
    for (const [start, end] of bounds.filter((g) => g.length === 2)) {
      gaps.set(Math.floor((start[0] + end[0]) / 2), end[1] - start[1]);
    }
    return gaps;
  }
}
