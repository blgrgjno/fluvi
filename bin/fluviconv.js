#!/usr/bin/env node
var path = require('path');
var pkg = require(path.join(__dirname, '..', 'package.json'));
var fluvi = require('fluvi');
var argv= require('optimist')
      .usage('Usage: $0 [options] DIRECTORY')
      .boolean(['h', 'v', 'n', 'c'])
      .argv;

// -------

process.bin = process.title = 'fluviconv';

if (argv.v) {
  console.log(pkg.version);
  process.exit();
}

if (argv.h || argv._.length != 1) {
  console.log([
    "usage: fluviconv [options] DIRECTORY",
    "",
    "DIRECTORY is the directory containing the fluvi directory",
    "options:",
    "  -n                Dry run)",
    "  -c                File is cutted (adjust slide startimes"
      + " according to videoIn)", // will adjust slides starttime
    "  -v                Print version.",
    "  -h                Write this help."
  ].join('\n'));

  if (argv._.length != 1) {
    console.log("DIRECTORY must be provided");
  }

  process.exit();
}

if (argv.n) {
  console.log("Not performing changes. Dry run!");
}

if (argv._.length == 1) {
  if (argv.n) {
    console.log("Would convert " + argv._[0]);
  } else {
    var ret = fluvi.convert(argv._[0], argv.c);
    if (! ret) {
      console.log("Unable to convert " + argv._[0]);
      process.exit();
    }
  }
}
