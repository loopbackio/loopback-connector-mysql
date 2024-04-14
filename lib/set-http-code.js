// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: loopback-connector-mysql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const _ = require('lodash');

const codes = {
  '404': [
    'ER_DB_DROP_EXISTS',
    'ER_BAD_TABLE_ERROR',
  ],
  '422': [
    'ER_DUP_ENTRY',
    'ER_CANT_CREATE_DB',
    'ER_DB_CREATE_EXISTS',
    'ER_TABLE_EXISTS_ERROR',
  ],
};

/*!
 * Translate MySQL error codes into HTTP Errors.
 * If an error would be better represented by a code that isn't 500,
 * add your SQL error to the correct HTTP code array above!
 */
module.exports = function(err) {
  let code = '';
  if (err && err.code) code = err.code;
  if (!err) {
    return;
  } else if (!(err instanceof Error)) {
    err = new Error(err); // Sucks that we weren't given an error object...
  }
  // Find error prefix
  const msg = err.message;
  const sqlError = msg.substring(0, msg.indexOf(':')) || code;

  for (const code in codes) {
    if (_.includes(codes[code], sqlError)) {
      err.statusCode = code;
    }
  }
  if (!err.statusCode) err.statusCode = 500;
  return err;
};
