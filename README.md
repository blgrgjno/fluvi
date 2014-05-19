# fluvi

> Convert fluvi export to more suitable format for a webapp

Requires an export from fluvi that contains all the files in a
well-known file/directory structure. Will perform a convert of all
file meta data from XML to JSON, and rename all found video
directories in a given directory.

## Install

Requires a working node installation.

```bash
$ git clone https://github.com/blgrgjno/fluvi.git
$ cd fluvi
$ sudo npm install --global
```

This will make the command ```fluviconf``` available from the command line.

## Basic Usage

```bash
$ fluviconv -h

usage: fluviconv [options] DIRECTORY

DIRECTORY is the directory containing the fluvi directory
options:
  -n                Dry run)
  -c                File is cutted (adjust slide startimes according to videoIn)
  -v                Print version.
  -h                Write this help.
DIRECTORY must be provided
```

```-c``` - this feature will assume that the video files are cutted
according to the videoIn value from the metadata
```-n``` - just for testing

## Typical workflow

A typical workflow to fix files consist of the following:

1. Move out all files that are not published. The fluviconv script
contains a feeature called -m for this purpose.

```bash
$ cd /mnt/video   # cd to the directory below export
$ mkdir unpublished
$ fluviconv -n -m unpublished exports     # -n = dry run, exports -
                                          # the exports folder
                                          # Hope it looks ok!
$ fluviconv -m unpublished exports
$ du -sh *                                # to show saved space
```

2. Now we can run the convertion

```bash
$ fluviconv -n -c -r exports             # use -n to test. If looks ok:
$ fluviconv -c -r exports                # time for coffee
...
```

3. Must convert swf to png (look below)

4. Then remove all non required thumbs. One possibility is
```bash
$ find exports|grep thumbs\/|grep -v mainThumb|xargs rm
```

## Source export format

Test data as exported, before convertion.

https://github.com/blgrgjno/fluvi/tree/master/test/media/metadata

## ./swf2png.sh

Example script for converting swf slides to png slides. Requires
swfrender installed (from the SWFTools package).

This feature should be part of the convertion script, but for now you
are required to do this manually.

## Testing

Can be tested with the following command:

```bash
$ npm test
```
