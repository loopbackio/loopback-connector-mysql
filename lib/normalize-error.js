'use strict';

/**
 * Normalizes MySQL-specific error numbers to standard, protocol-neutral domain codes.
 */
module.exports = function(err) {
  if (!err || !err.errno) return err;

  switch (err.errno) {
    // ER_DUP_ENTRY
    case 1062:
      err.code = 'UNIQUE_CONSTRAINT_VIOLATION';
      break;

    // ER_NO_SUCH_TABLE, ER_BAD_TABLE_ERROR
    case 1051:
    case 1146:
      err.code = 'TABLE_NOT_FOUND';
      break;

    // ER_ROW_IS_REFERENCED_2, ER_NO_REFERENCED_ROW_2, ER_NO_REFERENCED_ROW
    case 1215:
    case 1216:
    case 1217:
    case 1451:
    case 1452:
      err.code = 'FOREIGN_KEY_VIOLATION';
      break;

    // ER_BAD_NULL_ERROR
    case 1048:
      err.code = 'NOT_NULL_VIOLATION';
      break;

    // ER_CHECK_CONSTRAINT_VIOLATED
    case 3819:
      err.code = 'CHECK_CONSTRAINT_VIOLATION';
      break;

    // ER_TRUNCATED_WRONG_VALUE_FOR_FIELD, ER_DATA_TOO_LONG
    case 1366:
    case 1406:
      err.code = 'DATA_TYPE_MISMATCH';
      break;

    // ER_LOCK_DEADLOCK, ER_LOCK_WAIT_TIMEOUT
    case 1205:
    case 1213:
      err.code = 'LOCK_CONFLICT';
      break;

    // ER_CON_COUNT_ERROR, PROTOCOL_CONNECTION_LOST
    case 1040:
    case 1053:
      err.code = 'CONNECTION_FAILURE';
      break;
  }
  return err;
};
