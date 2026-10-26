const _ = require('lodash');
const { timeline } = require('./timeline');
const { mean, stdev } = require('stats-lite');

function evtTime(timeline, evt) {
  let match = timeline.find(e => e[0] === evt);
  return match ? match[1] : null;
}

function evtTimeBetween(timeline, evt1, evt2) {
  let t1 = evtTime(timeline, evt1);
  let t2 = evtTime(timeline, evt2);
  if (t1 === null || t2 === null) {
    return null;
  }
  return t2 - t1;
}

function xcuitestStat (timeline, commands) {
  let stats = {
    simStartLength: null,
    wdaStartLength: null,
    wdaSessionStartLength: null,
    numWdaStartAttempts: 0,
    numWdaSessionAttempts: 0,
  };

  let simStartMs = evtTimeBetween(timeline, "xcodeDetailsRetrieved", "simStarted");
  stats.simStartLength = simStartMs !== null ? simStartMs / 1000 : null;

  let wdaStartAnchor = evtTime(timeline, "simStarted") !== null
    ? "simStarted"
    : ["wdaStartAttempted", "appInstalled", "resetComplete", "xcodeDetailsRetrieved"]
        .find(evt => evtTime(timeline, evt) !== null);
  let wdaStartMs = wdaStartAnchor ? evtTimeBetween(timeline, wdaStartAnchor, "wdaSessionAttempted") : null;
  stats.wdaStartLength = wdaStartMs !== null ? wdaStartMs / 1000 : null;

  let wdaSessionStartMs = evtTimeBetween(timeline, "wdaSessionAttempted", "wdaSessionStarted");
  stats.wdaSessionStartLength = wdaSessionStartMs !== null ? wdaSessionStartMs / 1000 : null;
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
    let vals = allStats.map(s => s[key]).filter(v => typeof v === "number" && !Number.isNaN(v));
    avgs[key] = vals.length ? mean(vals) : null;
    stdevs[key] = vals.length ? stdev(vals) : null;
  }
  return [allStats, avgs, stdevs];
}

module.exports = {
  xcuitestStats
};
