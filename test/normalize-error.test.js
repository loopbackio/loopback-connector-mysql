'use strict';

const should = require('./init.js');
const normalizeMySQLError = require('../lib/normalize-error.js');

describe('normalizeMySQLError', function() {
  it('maps 1062 to UNIQUE_CONSTRAINT_VIOLATION', function() {
    const err = {errno: 1062};
    normalizeMySQLError(err);
    should.equal(err.code, 'UNIQUE_CONSTRAINT_VIOLATION');
  });

  it('maps 1146 and 1051 to TABLE_NOT_FOUND', function() {
    const err = {errno: 1146};
    normalizeMySQLError(err);
    should.equal(err.code, 'TABLE_NOT_FOUND');
  });

  it('maps 1452 to FOREIGN_KEY_VIOLATION', function() {
    const err = {errno: 1452};
    normalizeMySQLError(err);
    should.equal(err.code, 'FOREIGN_KEY_VIOLATION');
  });

  it('maps 1048 to NOT_NULL_VIOLATION', function() {
    const err = {errno: 1048};
    normalizeMySQLError(err);
    should.equal(err.code, 'NOT_NULL_VIOLATION');
  });

  it('maps 3819 to CHECK_CONSTRAINT_VIOLATION', function() {
    const err = {errno: 3819};
    normalizeMySQLError(err);
    should.equal(err.code, 'CHECK_CONSTRAINT_VIOLATION');
  });
});
