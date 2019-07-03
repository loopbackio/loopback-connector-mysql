// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: loopback-connector-postgresql
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const semver = require('semver');
const should = require('should');
const juggler = require('loopback-datasource-juggler');
const name = require('./package.json').name;

require('../../test/init');

describe(name, function() {
  before(function() {
    return global.resetDataSourceClass(juggler.DataSource);
  });

  after(function() {
    return global.resetDataSourceClass();
  });

  require('loopback-datasource-juggler/test/common.batch.js');
  require('loopback-datasource-juggler/test/default-scope.test.js');
  require('loopback-datasource-juggler/test/include.test.js');

  // === Operation hooks ==== //

  const suite = require('loopback-datasource-juggler/test/persistence-hooks.suite.js');
  const customConfig = Object.assign({}, global.config);
  suite(global.getDataSource(customConfig, juggler.DataSource), should, {replaceOrCreateReportsNewInstance: false});
});
