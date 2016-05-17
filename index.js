/**
 * image-duplicate-remover
 * https://github.com/paazmaya/image-duplicate-remover
 *
 * Remove duplicate images from the two given directories recursively
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (http://paazmaya.fi)
 * Licensed under the MIT license
 */

'use strict';

const fs = require('fs'),
  path = require('path'),
  childProcess = require('child_process'),
  crypto = require('crypto');

const imageExtensions = require('image-extensions'),
  sqlite3 = require('sqlite3');

const INDEX_NOT_FOUND = -1,
  EXTENSIONS = imageExtensions.concat(['mp4', 'avi', 'mpg', 'mpeg', 'mts', 'mov']);

// In memory database for storing meta information
const db = new sqlite3.Database(':memory:');

/**
 * Check if the given file path has a suffix matching the
 * available media file suffixes.
 *
 * @param {string} filepath  Absolute file path
 *
 * @returns {bool} True in case the filepath is a media file according to the suffix
 */
const isMedia = function _isMedia (filepath) {
  const ext = path.extname(filepath).slice(1).toLowerCase();

  return EXTENSIONS.indexOf(ext) !== INDEX_NOT_FOUND;
};

/**
 * Read a directory, by returning all files with full filepath
 *
 * @param {string} directory        Directory to read
 * @param {object} options          Set of options that are all boolean
 * @param {boolean} options.verbose Print out current process
 * @param {boolean} options.dryRun  Do not touch any files, just show what could be done
 *
 * @returns {array} List of image with full path
 */
const getImages = function _getImages (directory, options) {
  if (options.verbose) {
    console.log(`Reading directory ${directory}`);
  }
  let images = [];

  const items = fs.readdirSync(directory)
    .map((item) =>
      path.join(directory, item)
    );

  items.forEach((item) => {
    const stat = fs.statSync(item);

    if (stat.isFile() && isMedia(item)) {
      images.push(item);
    }
    else if (stat.isDirectory()) {
      images = images.concat(_getImages(item, options));
    }
  });

  return images;
};

/**
 * Create SHA-256 hash
 *
 * @param  {Buffer} content Image file contents
 * @return {string}         Hash string in base64
 */
const createHash = (content) => {
  // Hash generator
  const hash = crypto.createHash('sha256');

  hash.update(content, 'binary');

  return hash.digest('base64');
};

/**
 * Get information about the image file
 *
 * @see http://www.graphicsmagick.org/GraphicsMagick.html#details-format
 * @param  {string} filepath Image file path
 * @return {object}          Meta information object
 */
const identifyImage = (filepath) => {
  const options = {
    cwd: path.dirname(filepath),
    encoding: 'utf8'
  };
  /*
     %b   file size
     %h   height
     %w   width
     %k   number of unique colors
     %q   image bit depth
     %Q   compression quality

     gm identify -format "%b %h %w %k %q %Q" ~/Dropbox/jukka-paasonen-ms2014-10_crop640_.jpg
     87.5Ki 640 640 80265 8 93
  */
  const command = `gm identify -format "%b %h %w %k %q %Q" ${filepath}`;

  const stdout = childProcess.execSync(command, options);

  const raws = stdout.split(' '),
    values = {},
    keys = [
      'filesize',
      'height',
      'width',
      'uniquecolors',
      'bitdepth',
      'compression'
    ];
  keys.forEach((item, index) => {
    values[item] = raws[index];
  });

  return values;
};

/**
 * Read meta informations from file and save to database
 *
 * @param  {string} filepath Image file path
 * @return {[type]}          [description]
 */
const readImage = (filepath) => {
  const meta = identifyImage(filepath);
  const content = fs.readFileSync(filepath);
  const sha256 = createHash(content);
};

/**
 * Remove duplicates found from the secondary directory after comparing against the primary directory
 *
 * @param {string} primaryDir       Primary directory from which files will not be deleted
 * @param {string} secondaryDir     Secondary directory from which files are deleted
 * @param {object} options          Set of options that are all boolean
 * @param {boolean} options.verbose Print out current process
 * @param {boolean} options.dryRun  Do not touch any files, just show what could be done
 *
 * @returns {void}
 */
module.exports = function duplicateRemover (primaryDir, secondaryDir, options) {
  const primaryImages = getImages(primaryDir, options);
  const secondaryImages = getImages(secondaryDir, options);

  console.log('secondaryImages.length before reduction: ' + secondaryImages.length);

  // Remove possible duplicate file paths
  secondaryImages = secondaryImages.filter((item) => {
    return primaryImages.indexOf(item) === INDEX_NOT_FOUND;
  });

  console.log('secondaryImages.length after reduction: ' + secondaryImages.length);

  if (options.verbose) {
    console.log(`Found total of ${primaryImages.length} to compare with image ${secondaryImages.length}`);
  }

  // Counter for files that were removed
  let removedFiles = 0;

  primaryImages.forEach((primaryItem) => {
    secondaryImages.forEach((secondaryItem) => {

      if (options.verbose) {
        console.log(`Removing ${secondaryItem} since it is the same as ${primaryItem}`);
      }

      if (!options.dryRun) {
        fs.renameSync(secondaryItem);
        ++removedFiles;
      }
    });
  });

  console.log(`Removed total of ${removedFiles} duplicate image files`);
};

// Exposed for testing
module.exports._isMedia = isMedia;
module.exports._getImages = getImages;
