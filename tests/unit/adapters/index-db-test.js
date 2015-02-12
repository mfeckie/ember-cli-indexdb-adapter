import {
  moduleFor,
  test
  } from 'ember-qunit';

import Ember from 'ember';

var databaseName = 'ember-cli-indexed-db-test-database';

var App = {};

var migration;

var deleteDatabase = function (databaseName) {
  var deletion = indexedDB.deleteDatabase(databaseName);
  deletion.onsuccess = function () {

  };
  deletion.onerror = function (err) {
    console.log('Problem deleting database:');
    console.log(err);
  };
};

var openDatabase = function (databaseName) {
  return new Ember.RSVP.Promise(function (resolve, reject) {
    var connection = indexedDB.open(databaseName);
    connection.onsuccess = function (event) {
      Ember.run(function () {
        var db = connection.result;

        db.onerror = function (event) {
          Ember.run(function () {
            console.error('Error: ', event);
            reject(event);
          });
        };
        resolve(event.target.result);
      });
    };
  });
};

moduleFor('adapter:index-db', 'IndexDbAdapter', {
  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']
  setup: function () {
    App.Person = DS.Model.extend({
      name: DS.attr('string'),
      cool: DS.attr('boolean'),
      phones: DS.hasMany('phone')
    });
    App.Person.toString = function () { return "App.Person"; };

    var TestMigration = DS.IndexedDBMigration.extend({
      migrations: function() {
        this.addModel(App.Person);
      }
    });

    migration = TestMigration.create({
      databaseName: databaseName,
      version: 1
    });
    window.migration = migration;

  },
  teardown: function () {
    deleteDatabase(databaseName);
  }
});

var adapter;

// Replace this with your real tests.
test('it exists', function () {
  adapter = this.subject();
  ok(adapter);
});

test('Runs migrations', function () {
  QUnit.stop();
  migration.migrate().then(function() {
    return openDatabase(databaseName);
  }).then(function(db) {
    db.close();
    ok(db.objectStoreNames.contains("App.Person"), "Person object store created");
    QUnit.start();
  });
});
