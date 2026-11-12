'use strict';

const should = require('./init.js');
const normalizeMySQLError = require('../lib/normalize-error.js');

describe('normalizeMySQLError', function() {
  describe('Data Integrity & Constraints', function() {
    it('maps 1062 to UNIQUE_CONSTRAINT_VIOLATION', function() {
      const err = {errno: 1062};
      normalizeMySQLError(err);
      should.equal(err.code, 'UNIQUE_CONSTRAINT_VIOLATION');
    });

    it('maps foreign key error numbers (1215, 1216, 1217, 1451, 1452) to FOREIGN_KEY_VIOLATION', function() {
      [1215, 1216, 1217, 1451, 1452].forEach(errno => {
        const err = {errno};
        normalizeMySQLError(err);
        should.equal(err.code, 'FOREIGN_KEY_VIOLATION');
      });
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

  describe('Schema & Object Definitions', function() {
    it('maps table not found error numbers (1051, 1146) to TABLE_NOT_FOUND', function() {
      [1051, 1146].forEach(errno => {
        const err = {errno};
        normalizeMySQLError(err);
        should.equal(err.code, 'TABLE_NOT_FOUND');
      });
    });

    it('maps generated column error numbers (3105, 1906) to GENERATED_COLUMN_VIOLATION', function() {
      [3105, 1906].forEach(errno => {
        const err = {errno};
        normalizeMySQLError(err);
        should.equal(err.code, 'GENERATED_COLUMN_VIOLATION');
      });
    });
  });

  describe('Data Formatting & Types', function() {
    it('maps data type mismatch error numbers (1366, 1406) to DATA_TYPE_MISMATCH', function() {
      [1366, 1406].forEach(errno => {
        const err = {errno};
        normalizeMySQLError(err);
        should.equal(err.code, 'DATA_TYPE_MISMATCH');
      });
    });
  });

  describe('Concurrency & Execution', function() {
    it('maps lock conflict error numbers (1205, 1213) to LOCK_CONFLICT', function() {
      [1205, 1213].forEach(errno => {
        const err = {errno};
        normalizeMySQLError(err);
        should.equal(err.code, 'LOCK_CONFLICT');
      });
    });

    it('maps query timeout error numbers (1907, 3024) to QUERY_TIMEOUT', function() {
      [1907, 3024].forEach(errno => {
        const err = {errno};
        normalizeMySQLError(err);
        should.equal(err.code, 'QUERY_TIMEOUT');
      });
    });

    it('maps 1064 to SYNTAX_ERROR', function() {
      const err = {errno: 1064};
      normalizeMySQLError(err);
      should.equal(err.code, 'SYNTAX_ERROR');
    });
  });

  describe('Infrastructure & Connection', function() {
    it('maps connection failure error numbers (1040, 1053, 2006, 2013) to CONNECTION_FAILURE', function() {
      [1040, 1053, 2006, 2013].forEach(errno => {
        const err = {errno};
        normalizeMySQLError(err);
        should.equal(err.code, 'CONNECTION_FAILURE');
      });
    });
  });

  describe('Fallback behavior', function() {
    it('returns original error unchanged if errno is unrecognized or missing', function() {
      const err = {errno: 9999, message: 'unknown'};
      const result = normalizeMySQLError(err);
      should.equal(result.code, undefined);
    });
  });
});
