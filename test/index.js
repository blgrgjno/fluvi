'use strict';
var expect = require('chai').expect;
var fluvi = require('..');
var ncp = require('ncp').ncp;
var rimraf = require('rimraf');
var FS = require('fs');
var path = require('path');

ncp.limit = 16;
ncp.stopOnError = true;

var TEST_DIR = 'test/media/metadata';
var TEST_ID = 'af1a2a58-18ed-4291-8d63-f964032aacd5';
var TEST_VALUE = 'test/media/metadata/20110808_Minnemarkering-7680';
/*var TEST_ID = 'b4478ed2-a624-4189-b16f-d9fbb0e20653';
var TEST_VALUE = 'test/media/metadata/Lansering_av__Delte_meninger__på_eNorge-forum-5521';*/
//var TEST_DIID = '7680';

describe('fluvi', function() {
  var dirs = fluvi.index(TEST_DIR);

  it('index should return dirs', function(done) {
    expect(dirs).to.be.an('object');
    expect(dirs).to.be.ok;
    done();
  });

  it('index should contain correct data', function(done) {
    expect(dirs).to.include.keys(TEST_ID);
    expect(dirs[TEST_ID]).to.have.string(TEST_VALUE);
    done();
  });

  var meta = fluvi.meta(TEST_DIR);

  it('meta should return dirs', function(done) {
    expect(meta).to.be.an('array');

    var obj = meta.filter(function(value) {
      var ret = value.itemID.toString() === TEST_ID;
      //console.log('|' + value.itemID + '|' + TEST_ID + '|'+ret);
      return ret;
    });

    expect(obj.length).to.be.above(0);
    expect(obj[0]).to.include.keys('itemID', 'category', 'diID',
                                   'duration', 'created',
                                   'published', 'title', 'videoIn',
                                   'videoOut', 'videoFile', 'slides');
    done();
  });

/*  it('slides and numSlides should be equal', function(done) {
    var obj = meta.filter(function(value) {
      return value.itemID === TEST_ID;
    });

    expect(obj[0].slides.length).to.be.above(1);
    expect(obj[0].slides.length).to.be.eql(obj[0].numSlides[0]);
    done();
  }); */

  function setup(done) {
    // make root dir
    FS.mkdirSync('test/tmp');
    // copy files to tmp folder so that testing is possible
    ncp(TEST_VALUE, 'test/tmp/'+path.basename(TEST_VALUE), function (err) {
      if (err) {
        return done(err);
      }
      return done();
    });
  }

  function tear(done, clean) {
    // cleanup tmp file
    if (clean) {
      rimraf('test/tmp', function (err) {
        if (err) {
          return done(err);
        }
        return done();
      });
    } else {
      return done();
    }

    return true;
  }

  describe('file operations', function() {
    // prepare test
    before(setup);
    // cleanup test
    after(function(done) {
      tear(done, true);
    });

    var directory, guid, renamedDirectory;

    it('should be successfully converted', function(done) {
      // use a tmp directory with our testfile
      directory = 'test/tmp/' + path.basename(TEST_VALUE);
      // store the guid before we convert (need it later)
      guid = fluvi.getGUIDFromDirectory(directory);
      // the directory to look for after its renamed
      renamedDirectory = 'test/tmp/' + guid;
      var converted = fluvi.convert(directory);
      expect(converted).to.be.a('boolean');
      expect(converted).to.be.true;
      done();
    });

    it('should not try to convert again', function(done) {
      // TODO: look for error output
      var converted = fluvi.convert(directory);
      expect(converted).to.be.a('boolean');
      expect(converted).to.be.false;
      done();
    });

    it('direcory must be renamed', function(done) {
      // check if old dir is removed
      expect(FS.existsSync(directory)).to.be.false;
      // ..and new dir exists
      expect(FS.existsSync(renamedDirectory)).to.be.true;
      done();
    });

    it('should have same guid as before', function(done) {
      // read the meta again..now after convert
      var newguid = fluvi.getGUIDFromDirectory(renamedDirectory);
      // compare with old guid
      expect(guid).to.equal(newguid);
      done();
    });
  });

  describe('file operations', function() {
    // prepare test
    before(setup);
    // cleanup test
    after(function(done) {
      tear(done, true);
    });
    var directory, guid, renamedDirectory;

    it('should convert with cutting', function(done) {
      directory = 'test/tmp/' + path.basename(TEST_VALUE);
      // store the guid before we convert (need it later)
      guid = fluvi.getGUIDFromDirectory(directory);
      // the directory to look for after its renamed
      renamedDirectory = 'test/tmp/' + guid;
      var converted = fluvi.convert(directory, true);
      expect(converted).to.be.a('boolean');
      expect(converted).to.be.true;
      done();
    });
  });
});
