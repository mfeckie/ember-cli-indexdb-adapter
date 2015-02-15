import {
  moduleFor,
  test
  } from 'ember-qunit';

import {
  deleteDatabase,
  openDatabase,
  setupStore
  } from  'dummy/tests/helpers/database-helpers';

import Ember from 'ember';
import DS from 'ember-data';

import IndexedDbAdapter from 'indexdb-adapter/adapters/indexed-db';

var databaseName = 'ember-cli-indexed-db-test-database';
var adapter;

moduleFor('adapter:indexed-db', 'IndexedDB Adapter', {
  beforeEach: function () {
    QUnit.stop();
    deleteDatabase(databaseName).then(function () {
      QUnit.start();
    });
    adapter = this.subject({
      databaseName: databaseName
    });
  },
  afterEach: function () {
    deleteDatabase(databaseName);
  }
});

test('creates a database', function () {
  expect(1);

  adapter.openDatabase().then(function (ev) {

    equal(ev.name, databaseName);

    ev.close();
  });
});

test('Adds a model', function () {
  expect(1);

  adapter.addModel('user').then(function () {
    adapter.openDatabase().then(function (db) {


      ok(db.objectStoreNames.contains('user'));

      db.close();
    });
  });
});

test('Adds two models', function () {
  expect(2);

  adapter.addModel('user').then(function () {
    adapter.addModel('powers').then(function () {
      adapter.openDatabase().then(function (db) {

        ok(db.objectStoreNames.contains('user'));
        ok(db.objectStoreNames.contains('powers'));

        db.close();
      });
    });
  });
});
