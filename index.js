#!/usr/bin/env node

const minimist = require('minimist');
const path = require('path');
const { lstatSync, readdirSync } = require('fs');
const { timeline, printTimeline } = require('./timeline');
const { xcuitestStats } = require('./stats');


function main () {
  const argv = minimist(process.argv.slice(2));
  let input = argv.i || argv.input;
  if (!input) {
    throw new Error("Use -i to pass location of an input .json file");
  }
  let data = [];
  // check whether input is dir or not
  let stat = lstatSync(input);
  if (stat.isDirectory()) {
    for (let file of readdirSync(input)) {
      if (/\.json$/.test(file)) {
        data.push(require(path.resolve(input, file)));
      }
    }
  } else {
    data.push(require(input));
  }
  if (argv.t) {
    if (data.length > 1) {
      throw new Error("timeline can only have one json file");
    }
    let t = timeline(data[0].events || data[0]);
    printTimeline(t, 50);
    return;
  }
  if (argv.s) {
    let [allStats, avgs, stdevs] = xcuitestStats(data);
    let stats = {avgs, stdevs};
    console.log(stats);
  }

}

if (module === require.main) {
  main();
}
