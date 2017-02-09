/**
 * image-duplicate-remover
 * https://github.com/paazmaya/image-duplicate-remover
 *
 * Remove duplicate images from the two given directories recursively
 *
 * Copyright (c) Juga Paazmaya <paazmaya@yahoo.com> (https://paazmaya.fi)
 * Licensed under the MIT license
 */

'use strict';

//const path = require('path');

const tape = require('tape'),
  storeImageData = require('../../lib/store-image-data');
/*
tape('inserts data to database when file exists', (test) => {
  test.plan(3);

  const filepath = path.join(__dirname, '..', 'fixtures', 'a', 'You Dont Know npm.png');

  const db = {
    prepare: function (query) {
      test.equal(query, 'INSERT INTO files VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 'Query prepared properly');

      return {
        run: function (values) {
          test.deepEqual(values, [
            filepath,
            '60673c95c25853d7e199d5f0d2632f99657383ad18a56e30ab464a1aa97d21c2',
            3155,
            8,
            662,
            2,
            1236
          ]);
        },
        finalize: function () {
          test.pass('Finalised called as expected');
        }
      };
    }
  };
  storeImageData([filepath], db);

});
*/

tape('does not use database when list is empty', (test) => {
  test.plan(1);

  const ret = storeImageData([]);
  test.notOk(ret);
});