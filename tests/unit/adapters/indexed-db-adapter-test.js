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
var store;

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

  adapter.addModel('superhero').then(function () {
    adapter.openDatabase().then(function (db) {


      ok(db.objectStoreNames.contains('superhero'));

      db.close();
    });
  });
});

test('Adds two models', function () {
  expect(2);

  adapter.addModel('superhero').then(function () {
    adapter.addModel('powers').then(function () {
      adapter.openDatabase().then(function (db) {

        ok(db.objectStoreNames.contains('superhero'));
        ok(db.objectStoreNames.contains('powers'));

        db.close();
      });
    });
  });
});


(function () {
  var databaseName = 'creation-test';
  var SuperHero = DS.Model.extend({
    name: DS.attr()
  });

  var env = setupStore({
    adapter: IndexedDbAdapter.extend({
      databaseName: databaseName,
      models: ['superhero']
    }),
    superhero: SuperHero
  });

  var store = env.store;


  test('can persist a record', function () {
    Ember.run(function () {
      var wonderWoman = {name: 'Wonder Woman'};
      var record = store.createRecord('superhero', wonderWoman);
      var promise = record.save();
      promise.then(function () {
        env.adapter.openDatabase().then(function (conn) {
          var transaction = conn.transaction('superhero', 'readonly');
          var objectStore = transaction.objectStore('superhero');
          var request = objectStore.get(1);

          transaction.oncomplete = function () {
            deleteDatabase(databaseName);
          };

          transaction.onerror = function (event) {
            console.error(event);
          };

          request.onsuccess = function (event) {
            var result = event.target.result;
            deepEqual(result, {id: 1, name: 'Wonder Woman'});
            conn.close();
          };

          request.onerror = function (event) {
            console.error(event);
            conn.close();
          };
        });
      });
    });
  });

})();
