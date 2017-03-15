function timeline (data) {
  // data starts out looking like:
  // {
  //   "eventName": [timestamp1, timestamp2],
  //   "eventName2": [timestamp3],
  //   ...
  // }

  let absTimeline = [];
  // first, turn that into one array of event tuples:
  // [
  //   ["eventName", timestamp1],
  //   ["eventName", timestamp2],
  //   ["eventName2", timestamp3]
  // ]
  for (let eventType of Object.keys(data).filter(k => k !== 'commands')) {
    for (let eventTime of data[eventType]) {
      absTimeline.push([eventType, eventTime]);
    }
  }

  if (!absTimeline.length) {
    // short circuit if we don't have anything
    return [];
  }

  // now sort by timestamp
  absTimeline.sort((a, b) => {
    return a[1] - b[1];
  });

  // now normalize time so the first event is at time 0
  const firstEventTime = absTimeline[0][1];
  let relTimeline = [];
  for (let eventTuple of absTimeline) {
    relTimeline.push([eventTuple[0], eventTuple[1] - firstEventTime]);
  }

  return relTimeline;
}

function printTimeline (timeline, lines = 200) {
  const msPerLine = timeline[timeline.length - 1][1] / lines;
  let slices = [];
  for (let i = 0; i <= lines; i++) {
    slices[i] = [];
  }
  for (let evtTuple of timeline) {
    let [evt, time] = evtTuple;
    let slice = Math.ceil(time / msPerLine);
    slices[slice].push([evt, time]);
  }

  // find gaps
  let gaps = [];
  for (let i = 0, j = 1; i < slices.length - 1, j < slices.length; i++, j++) {
    // if slices[i] has data and slices[j] does not, we are starting a gap
    // if slices[i] has no data and slices[j] does, we are ending a gap
    if (slices[i].length && !slices[j].length) {
      gaps.push([[i, slices[i][slices[i].length - 1][1]]]);
    }
    if (!slices[i].length && slices[j].length) {
      gaps[gaps.length - 1].push([j, slices[j][0][1]]);
    }
  }

  // add time of gaps at midpoints in slice
  for (let gap of gaps) {
    // gap will look like [[1, 951], [27, 33186]]
    let midpoint = Math.floor((gap[0][0] + gap[1][0]) / 2);
    slices[midpoint] = gap[1][1] - gap[0][1];
  }

  let printLines = [];
  let widestLineWidth = 0;
  for (let slice of slices) {
    let line;
    if (typeof slice === "number") {
      line = `(${slice / 1000}s)`;
    } else if (slice.length) {
      let evts = slice.map(s => `${s[0]}@${s[1] / 1000}s`);
      line = `[${evts.join(', ')}]`;
    } else {
      line = '|';
    }
    if (line.length > widestLineWidth) {
      widestLineWidth = line.length;
    }
    printLines.push(line);
  }

  // print centered
  for (let line of printLines) {
    let padding = Math.floor((widestLineWidth - line.length) / 2);
    let padStr = '';
    for (let i = 0; i < padding; i++) {
      padStr += ' '; // LEFT PAD
    }
    console.log(`${padStr}${line}`);
  }

}

module.exports = {
  timeline,
  printTimeline
};
