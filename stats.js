const _ = require('lodash');
const { timeline } = require('./timeline');
const { mean, stdev } = require('stats-lite');

function evtTime(timeline, evt) {
  return timeline.filter(e => e[0] === evt)[0][1];
}

function evtTimeBetween(timeline, evt1, evt2) {
  return evtTime(timeline, evt2) - evtTime(timeline, evt1);
}

function xcuitestStat (timeline, commands) {
  let stats = {
    simStartLength: null,
    wdaStartLength: null,
    wdaSessionStartLength: null,
    numWdaStartAttempts: 0,
    numWdaSessionAttempts: 0,
  };

  stats.simStartLength = evtTimeBetween(timeline, "xcodeDetailsRetrieved", "simStarted") / 1000;
  stats.wdaStartLength = evtTimeBetween(timeline, "simStarted", "wdaSessionAttempted") / 1000;
  stats.wdaSessionStartLength = evtTimeBetween(timeline, "wdaSessionAttempted", "wdaSessionStarted") / 1000;
  stats.numWdaStartAttempts = timeline.filter(e => e[0] === "wdaStartAttempted").length;
  stats.numWdaSessionAttempts = timeline.filter(e => e[0] === "wdaSessionAttempted").length;

  return stats;
}

function xcuitestStats (dataSets) {
  // each data set corresponds to a json file
  let allStats = [];
  let keys = [];
  for (let set of dataSets) {
    // might have a full session capabilities object with events key, or maybe just event data itself
    set = set.events || set;
    let t = timeline(set);
    let stats = xcuitestStat(t, set.commands);
    keys = Object.keys(stats);
    allStats.push(stats);
  }
  let avgs = {};
  let stdevs = {};
  for (let key of keys) {
    let vals = allStats.map(s => s[key]);
    avgs[key] = mean(vals);
    stdevs[key] = stdev(vals);
  }
  return [allStats, avgs, stdevs];
}

module.exports = {
  xcuitestStats
};
