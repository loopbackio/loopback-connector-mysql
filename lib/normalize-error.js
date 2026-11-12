'use strict';

/**
 * Normalizes MySQL-specific error numbers to standard, protocol-neutral domain codes.
 */
module.exports = function(err) {
  if (!err || !err.errno) return err;

  switch (err.errno) {
    // 1. Data Integrity & Constraints
    case 1062: // ER_DUP_ENTRY
      err.code = 'UNIQUE_CONSTRAINT_VIOLATION';
      break;
    case 1215: // ER_CANNOT_ADD_FOREIGN
    case 1216: // ER_NO_REFERENCED_ROW
    case 1217: // ER_ROW_IS_REFERENCED
    case 1451: // ER_ROW_IS_REFERENCED_2
    case 1452: // ER_NO_REFERENCED_ROW_2
      err.code = 'FOREIGN_KEY_VIOLATION';
      break;
    case 1048: // ER_BAD_NULL_ERROR
      err.code = 'NOT_NULL_VIOLATION';
      break;
    case 3819: // ER_CHECK_CONSTRAINT_VIOLATED
      err.code = 'CHECK_CONSTRAINT_VIOLATION';
      break;

    // 2. Schema & Object Definitions
    case 1051: // ER_BAD_TABLE_ERROR
    case 1146: // ER_NO_SUCH_TABLE
      err.code = 'TABLE_NOT_FOUND';
      break;
    case 3105: // MySQL Generated column value ignored/disallowed
    case 1906: // MariaDB Generated column value ignored/disallowed
      err.code = 'GENERATED_COLUMN_VIOLATION';
      break;

    // 3. Data Formatting & Types
    case 1366: // ER_TRUNCATED_WRONG_VALUE_FOR_FIELD
    case 1406: // ER_DATA_TOO_LONG
      err.code = 'DATA_TYPE_MISMATCH';
      break;

    // 4. Concurrency & Execution
    case 1205: // ER_LOCK_WAIT_TIMEOUT
    case 1213: // ER_LOCK_DEADLOCK
      err.code = 'LOCK_CONFLICT';
      break;
    case 1907: // Query timeout
    case 3024: // Statement timeout
      err.code = 'QUERY_TIMEOUT';
      break;
    case 1064: // ER_PARSE_ERROR (Syntax error)
      err.code = 'SYNTAX_ERROR';
      break;

    // 5. Infrastructure & Connection
    case 1040: // ER_CON_COUNT_ERROR (Too many connections)
    case 1053: // PROTOCOL_CONNECTION_LOST
    case 2006: // CR_SERVER_GONE_ERROR (MySQL server has gone away)
    case 2013: // CR_SERVER_LOST (Lost connection to MySQL server during query)
      err.code = 'CONNECTION_FAILURE';
      break;
  }
  return err;
};
