2016-12-19, Version 2.4.1
=========================

 * Fix CI Failures (Loay Gewily)

 * Revert dev-dependency on loopback to 2.x (Siddhi Pai)

 * Set publish tag to "lts" (Siddhi Pai)

 * Update README with correct doc links, etc (Amir Jafarian)


2016-10-17, Version 2.4.0
=========================

 * Add connectorCapabilities global object (#201) (Nicholas Duffy)

 * Remove unused prefix for test env vars (#203) (Simon Ho)

 * Update translation files - round#2 (#199) (Candy)

 * Add CI fixes (#197) (Loay)

 * Add translated files (gunjpan)

 * Update deps to loopback 3.0.0 RC (Miroslav Bajtoš)

 * Remove Makefile in favour of NPM test scripts (Simon Ho)

 * Fixing lint errors (Ron Lloyd)

 * Autoupdate mysql.columnName bug fix (Ron Lloyd)

 * Tests for autoupdate mysql.columnName bug fix (Ron Lloyd)

 * Use juggler@3 for running the tests (Miroslav Bajtoš)

 * Explictly set forceId:false in test model (Miroslav Bajtoš)

 * Fix pretest and init test configs (Simon Ho)

 * Fix to configure model index in keys field (deepakrkris)

 * Update eslint infrastructure (Loay)

 * test: use dump of original test DB as seed (Ryan Graham)

 * test: skip cardinality, update sub_part (Ryan Graham)

 * test: accept alternate test db credentials (Ryan Graham)

 * test: use should for easier debugging (Ryan Graham)

 * test: account for mysql version differences (Ryan Graham)

 * test: match case with example/table.sql (Ryan Graham)

 * test: separate assertions from test flow control (Ryan Graham)

 * test: update tests to use example DB (Ryan Graham)

 * test: seed test DB with example (Ryan Graham)

 * test: fix undefined password (Ryan Graham)

 * Add special handling of zero date/time entries (Carl Fürstenberg)

 * Add globalization (Candy)

 * Update URLs in CONTRIBUTING.md (#176) (Ryan Graham)


2016-06-21, Version 2.3.0
=========================

 * Add function connect (juehou)

 * insert/update copyright notices (Ryan Graham)

 * relicense as MIT only (Ryan Graham)

 * Override other settings if url provided (juehou)

 * Add `connectorCapabilities ` (Amir Jafarian)

 * Implement ReplaceOrCreate (Amir Jafarian)


2016-02-19, Version 2.2.1
=========================

 * Remove sl-blip from dependencies (Miroslav Bajtoš)

 * Upgrade `should` module (Amir Jafarian)

 * removed console.log (cgole)

 * seperate env variable for test db (cgole)

 * Changed username to user (cgole)

 * Added db username password (cgole)

 * Add mysql CI host (cgole)

 * Refer to licenses with a link (Sam Roberts)

 * Pass options to the execute command. (Diogo Correia)

 * Use strongloop conventions for licensing (Sam Roberts)


2015-07-30, Version 2.2.0
=========================

 * Clean up regexop tests (Simon Ho)

 * Add regexp operator tests (Simon Ho)

 * Fix RegExp unit test setup/teardown (Simon Ho)

 * Add support for RegExp operator (Simon Ho)


2015-05-29, Version 2.1.1
=========================

 * Fix the failing tests (Raymond Feng)


2015-05-18, Version 2.1.0
=========================

 * Update deps (Raymond Feng)

 * Start to add transaction support (Raymond Feng)


2015-05-14, Version 2.0.1
=========================

 * Fix the typo (Raymond Feng)


2015-05-13, Version 2.0.0
=========================

 * Update deps (Raymond Feng)

 * Refactor the code to use base SqlConnector (Raymond Feng)


2015-04-02, Version 1.7.0
=========================

 * Return isNewInstance from upsert (Raymond Feng)

 * Update rc dep (Raymond Feng)

 * Return count when updating or deleting models (Simon Ho)

 * Update README.md (Simon Ho)

 * Add test running instructions to readme (Simon Ho)

 * Fix mysql neq for NULL value. (ulion)

 * replace dataLength instead of adding length property (Partap Davis)

 * Allow models backed by MySQL to reference mongodb ObjectID (Raymond Feng)

 * Query string length for schema in characters in addition to bytes (Partap Davis)


2015-02-20, Version 1.6.0
=========================

 * Update deps (Raymond Feng)

 * Include tests of persistence hooks from juggler. (Miroslav Bajtoš)


2015-01-15, Version 1.5.1
=========================

 * Fix the loop of models (Raymond Feng)

 * Set ok default to false (Geoffroy Lesage)

 * Fixed missing 'ok' (Geoffroy Lesage)

 * Changed default type mapping (Geoffroy Lesage)

 * Fixed isActual syntax to accept optional model arg (Geoffroy Lesage)

 * Fixed isActual implemenation (Geoffroy Lesage)

 * Inherit Schema From DataSource if not defined (Serkan Serttop)


2015-01-09, Version 1.5.0
=========================

 * Use mysql.escape/escapeId() (Raymond Feng)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)

 * (cherry picked from commit a6d31e8) (yogesh)


2014-12-05, Version 1.4.9
=========================

 * Add a test case for autoupdate (Raymond Feng)

 * Create 'NOT NULL' constraint for required or id properties (Raymond Feng)

 * Better handle discovery of nullable columns (Raymond Feng)


2014-11-27, Version 1.4.8
=========================

 * fix(initialization): bug fix for setting limit on number of connections in connection pool (cpentra1)

 * Add contribution guidelines (Ryan Graham)


2014-09-11, Version 1.4.7
=========================

 * Enhance error reporting for automigrate/autoupdate (Raymond Feng)


2014-09-10, Version 1.4.6
=========================

 * Bump version (Raymond Feng)

 * Use table name instead of model name (Raymond Feng)

 * Use async and make sure errors are passed to callback (Raymond Feng)


2014-08-25, Version 1.4.5
=========================

 * Bump version (Raymond Feng)

 * Make sure the deferred query will be invoked only once (Raymond Feng)


2014-08-20, Version 1.4.4
=========================

 * Bump version (Raymond Feng)

 * Add ping() (Raymond Feng)


2014-08-20, Version 1.4.3
=========================

 * Bump version (Raymond Feng)

 * Fix MySQL conversion for embedded model instance (Raymond Feng)

 * Fix the createDatabase option (Raymond Feng)


2014-08-15, Version 1.4.2
=========================

 * Bump version (Raymond Feng)

 * Allow properties to pass through mysql driver (Raymond Feng)

 * Fix the default length for strings to avoid row size overflow (Raymond Feng)


2014-06-27, Version 1.4.1
=========================

 * Bump version (Raymond Feng)

 * Fix the test cases as now inq/nin is checked for array values (Raymond Feng)

 * Update link to doc (Rand McKinney)


2014-06-23, Version 1.4.0
=========================

 * Bump version (Raymond Feng)

 * cannot read property of undefined fixed (Johnny Bill)

 * Fix comparison for null and boolean values (Raymond Feng)

 * Map object/json to TEXT (Raymond Feng)


2014-06-04, Version 1.3.0
=========================

 * Remove peer dependency on datasource-juggler (Miroslav Bajtoš)


2014-06-02, Version 1.2.3
=========================

 * Bump version (Raymond Feng)

 * Fix sql injection and add test cases (Raymond Feng)


2014-05-29, Version 1.2.2
=========================

 * Bump version (Raymond Feng)

 * Fix the varchar length (Raymond Feng)

 * Add like/nlike support (Raymond Feng)

 * Fix object/json type mapping (Raymond Feng)


2014-05-16, Version 1.2.1
=========================

 * Bump versions (Raymond Feng)

 * Fix buildWhere (Raymond Feng)

 * Add support for logical operators (AND/OR) (Raymond Feng)

 * updateOrCreate assumes numeric primary key(s) (Scott Anderson)


2014-04-08, Version 1.2.0
=========================

 * Bump version (Raymond Feng)

 * Remove the commented out code (Raymond Feng)

 * Fix the query for discovery with current user (Raymond Feng)

 * Fix the table generation for string ids (Raymond Feng)

 * Update deps (Raymond Feng)

 * Use NULL for undefined (Raymond Feng)

 * Prevent inserting undefined values (Marat Dyatko)

 * Update to dual MIT/StrongLoop license (Raymond Feng)

 * Fix merge issue (Raymond Feng)

 * Reformat code (Raymond Feng)

 * Update discovery.js (Samer Aldefai)

 * Fix link to docs. (Rand McKinney)

 * Replaced most content with link to docs. (Rand McKinney)

 * Move mocha args to test/mocha.opts (Ryan Graham)

 * Make 'npm test' more useful to CI (Ryan Graham)

 * Prevent extra files from going into npm (Ryan Graham)


2013-12-06, Version 1.1.1
=========================

 * Bump version (Raymond Feng)

 * Update deps (Raymond Feng)

 * Add the test for loopback-datasource-juggler PR-48 (Raymond Feng)

 * Fix the orderBy (Raymond Feng)


2013-11-27, Version 1.1.0
=========================

 * Bump version (Raymond Feng)

 * Refactor the runQuery logic into a function (Raymond Feng)

 * Improve the connector based on review feedbacks (Raymond Feng)

 * Allow connectionLmit to be set (Raymond Feng)

 * Use connection pool for MySQL (Raymond Feng)

 * Update docs.json (Rand McKinney)

 * Fix the regression caused by juggler (Raymond Feng)


2013-11-20, Version 1.0.2
=========================

 * Remove blanket (Raymond Feng)

 * Bump version and update deps (Raymond Feng)

 * Append error to the message (Raymond Feng)

 * Add NOTICE and update READE (Raymond Feng)

 * Update README.md (Rand McKinney)

 * Update the internal github dependency (Raymond Feng)


2013-10-28, Version 1.0.0
=========================

 * First release!
