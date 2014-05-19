#!/usr/bin/env node
'use strict';
var FS = require('fs');
var fluvi = require('fluviconv');
var path = require('path');
var pkg = require(path.join(__dirname, '..', 'package.json'));
var util = require('util');

var argv= require('optimist')
      .usage('Usage: $0 [options] DIRECTORY')
      .boolean(['h', 'v', 'n', 'c', 'r'])
      .string(['m'])
      .argv;

// -------

process.bin = process.title = 'fluviconv';

if (argv.h || argv._.length !== 1) {
  console.log([
    process.title + ' v' + pkg.version,
    'usage: ' + process.title + ' [options] DIRECTORY',
    '',
    'DIRECTORY is the directory containing the fluvi directory',
    'options:',
    '  -n                Dry run)',
    '  -c                File is cutted (adjust slide startimes' +
      ' according to videoIn)', // will adjust slides starttime
    '  -m <directory>    Move directories without webpageid to this directory',
    '  -r                Recurse',
    '  -v                Verbose',
    '  -h                Write this help.'
  ].join('\n'));

  if (argv._.length !== 1) {
    console.log('DIRECTORY must be provided');
  }

  process.exit();
}

if (argv.n) {
  util.log('Not performing changes. Dry run!');
}

function convertDirectory(directory, options) {
  var ret = fluvi.convert(directory, options);
  if (!ret) {
    util.log('Unable to convert ' + directory);
  }
}

var options = {};
options.dry = argv.n;
options.recurse = argv.r;
options.verbose = argv.v;
options.cut = argv.c;

function movetoDirectoryNotFound(error) {
  error = error || '';
  console.error('Not a directory, or unable to write to: `' + argv.m +
                '`');
  if (error) {
    console.error(error);
  }
  process.exit(-1);
}

function moveDirectories() {
  if (1 === argv._.length) {
    var numMoved = 0;
    var toBeMoved = fluvi.getUnpublished(argv._[0]);
    toBeMoved.forEach(function(item) {
      var newPath = path.join(argv.m, path.basename(item));

      if (! argv.n) {
        FS.renameSync(item, newPath);
        numMoved++;
      } else {
        util.log('Would have moved ' + item + ' to ' + newPath);
      }
    });
    if (numMoved) {
      util.log('Moved %d files to %s', numMoved, argv.m);
    }
  }
}

function runMain() {
  if (1 === argv._.length) {
    // check if this is a fluvi directory
    if ( true == FS.existsSync(argv._[0]) &&
         true === FS.statSync(argv._[0]).isDirectory() &&
         true === FS.existsSync(path.join(argv._[0], 'metadata.xml'))) {
      if (options.recurse) {
        util.log('Directory `' + argv._[0] + '` contains' +
                    ' metadata.xml. Ignoring recurse!');
        options.recurse = false;
      }
      convertDirectory(argv._[0], options);
    } else {
      if (options.recurse) {
        convertDirectory(argv._[0], options);
      } else {
        util.log(process.title + ': Don\'t know what to do.\nDirectory' +
                    ' is not a fluvi export and -r (recurse) option missing.');
      }
    }
  }
}

if (argv.m) {
  FS.stat(argv.m, function(err, stat) {
    if (err) {
      movetoDirectoryNotFound();
    }
    if (stat.isDirectory()) {
      FS.writeFile(path.join(argv.m, 'testfile'), 'mule', function(err) {
        if (err) {
          movetoDirectoryNotFound();
        }
        FS.unlinkSync(path.join(argv.m, 'testfile'));
        moveDirectories();
      });
    } else {
      movetoDirectoryNotFound('Not a directory (-m parameter) `'+
                              argv.m + '`');
    }
  });
} else {
  runMain();
}
