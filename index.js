'use_strict';

var FS = require('fs');
var Sync = require('sync');
var assert = require('assert');
var path = require('path');
var url = require('url');
var util = require('util');
var xml2js = require('xml2js');

/**
 * Returns directories in a directory.
 * @param {string} directory - Name of the directory
 * @returns {string[]} List of directories. Prefixed with directory
 * name from input
 */
function getDirsFromDirSync (directory) {
  var dirs = FS.readdirSync(directory, "utf-8");
  var retObj = [];
  dirs.forEach(function(f) {
    var file = path.join(directory, f);
    // ensure that it starts with directory
    if (0 !== file.indexOf(directory)) {
      throw "directory ended up somewhere unexpected after normalization";
    }

    if (FS.statSync(file).isDirectory()) {
      retObj[retObj.length] = file;
    }
  });

  return retObj;
};

/**
 * Adjust the metadata after the file has been cutted from videoIn
 * VideoIn will be set to 0 and all slides will get updated
 * @param {object} meta - Metadata object
 * @returns A new object with slides and videoIn adjusted
 */
function cutVideo(metaObj) {
  var i;

  if (! metaObj) {
    throw new TypeError('No `metaObj` argument provided to cutVideo');
  }

  // adjust all slide times
  if (metaObj.videoIn > 0) {
    metaObj.slides = metaObj.slides.map(function(f) {
      // dont adjust first slide
      if (f.startTime > 0) {
        f.startTime[0] -= metaObj.videoIn[0];
      }
      return f;
    });
  } else {
    assert.fail(metaObj.slides.length);
  }

  metaObj.videoIn = [0]; // reset videoIn
  return metaObj;
}

/**
 * Returns the metadata as an javascript object
 * @param {string} meta - The metadata
 * @returns An object containing the interesting part of th
 */
function getObjectFromMeta(meta, videoFile) {
  var slides = meta.videoTimelineInfo;

  // set slides to 0 if not set. numSslides below would then be 0
  if ("\n\t" == slides) {
    slides = null;
  }

  var retObj = {
    'itemID' : meta.item_id,
    'category' : meta.category,
    'diID' : meta.diId,
    'duration' : meta.duration,
    'created' : meta.created_date,
    'published' : meta.publish_date,
    'timestamp' : meta.timestamp, // TODO: hva er dette?
    'title' : meta.title,
    'videoIn' : meta.videoIn,
    'videoOut' : meta.videoOut,
    'videoFile' : [videoFile],
    'webPageID': meta.web_page_id,
    'slideScreenPosition': meta.slide_screen_position
  };

  // add slides
  if (slides != null) {
    var numSlides = 0;
    // got slides, adding them to retObj one by one because they need
    // some regexp love
    retObj["slides"] = [];
    slides[0].slide.forEach(function(slide) {
      if (slide.slideURL) {
        // ensure we only have 1 slideURL for each slide
        assert.equal(slide.slideURL.length, 1);

        // we need to rewrite slideURL
        if (slide.slideURL[0] &&
            typeof(slide.slideURL[0]) == "string" &&
            slide.slideURL[0] != "") {
          var pathname = url.parse(slide.slideURL[0]).pathname;
          var tmpPath = path.basename(pathname);
          slide.slideURL[0] = tmpPath;
        }
      }
      retObj["slides"][numSlides++] = slide;
    });
  }

  return retObj;
}

/**
 * Returns the metadata from the xml file as an object
 * @param {string} file - The file
 * @param {callback} callback - A callback
 * @returns An object containing all the meta data (xml2js)
 */
function getMetaDataFromDirectory (directory) {
  var parser = new xml2js.Parser();
  var file = directory + "/metadata.xml";

  var data = "";
  var ret = null;

  try {
    data = FS.readFileSync(file, "utf-8");
  } catch (ex) {
    // TODO: ignore
  }

  Sync(function() {
    parser.parseString(data, function(err, result) {
      if (err) {
        throw err;
      }
      ret = result.metadata;
    });
  });

  return ret;
}

/**
 * Locate video file in directory.
 * @param {string} directory - The directory to search for the file
 * @param {string[]} directories - A list of directories to search in
 * @returns Name of vide ofile
 */
function getVideoFromDirectory (directory) {
  var files = FS.readdirSync(directory);
  var video = files.filter(function(d) {
    return ".mp4" == d.substr(-4);
  });

  if (1 != video.length) {
    throw "Found " + video.length + " video files in directory \"" +
      directory + "\"";
  }

  return video[0];
};

exports.getGUIDFromDirectory = function(directory) {
  var meta = getMetaDataFromDirectory(directory);
  if (! meta ) {
    return "";
  } else {
    return meta.item_id[0];
  }
};

/**
 * Create an object with meta data for all files. Will iterate all
 * directories in the input directory, and look for fluvi dirs
 * @param {string} directory - The of the directory to search from
 * @returns {object} An array containing all elements
 */
exports.meta = function(directory) {
  var dirs = getDirsFromDirSync(directory);
  var ret = [];
  dirs.forEach(function(d) {
    var meta = getMetaDataFromDirectory(d);
    // copy the interesting part to an object with key set to itemID
    ret[ret.length] = getObjectFromMeta(meta, getVideoFromDirectory(d));
  });

  return ret;
};

/**
 * Create an index mapping guid from metadata.xml to directory. Will
 * iterate over all directories and create a key/value object mapping
 * from the guid to the directory name
 * @param {string} directory - The name of the directory to search from
 * @returns {object} Mapping between guid and filename
 */
exports.index = function (directory) {
  var dirs = getDirsFromDirSync(directory);
  var ret = {};

  dirs.forEach(function(d) {
    var meta = getMetaDataFromDirectory(d);
    var slides = meta.videoTimelineInfo;

    if ("\n\t" == slides) {
      slides = null;
    }

    ret[meta.item_id] = d;
  });

  return ret;
};

/**
 * Converts a directory from new to old format.
 * @param {string} directory - The name of the directory to convert
 * @param {boolean} cut - Should assume the video was cutted
 * @returns A boolean indicating success
 */
exports.convert = function (directory, cut) {
  var metadata = getMetaDataFromDirectory(directory);

  if (! metadata) {
    util.debug('already converted, or wrong directory was provided');
    return false;
  }

  var newDir = path.join(directory, "../" +
                         metadata.item_id[0].toString());

  // seems like it's already converted
  if (FS.existsSync(newDir)) {
    util.debug('already converted ' + directory);
    return false;
  }

  // directory it's there so try to get the JS meta object
  var metaObject = getObjectFromMeta(metadata,
                                     getVideoFromDirectory(directory));

  // adjust slide starttime according to video_in (cut file)
  if (cut) {
    metaObject = cutVideo(metaObject);
  }

  // and write it to file
  var ret = FS.writeFileSync(directory + '/meta.json',
                             JSON.stringify(metaObject, null, " "));
  if (ret) {
    return console.error(ret);
  }

  // now it should be ok to rename to its new name
  ret = FS.renameSync(directory, newDir);

  if (ret) {
    return console.error(ret);
  }

  // success
  return true;
};
