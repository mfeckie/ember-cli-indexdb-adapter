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

test('Creates a database', function () {
  QUnit.stop();
  migration.migrate().then(function() {
    return openDatabase(databaseName);
  }).then(function(db) {
    db.close();
    ok(db.objectStoreNames.contains("App.Person"), "Person object store created");
    QUnit.start();
  });
});

test("#addModel supports autoIncrement", function() {
  var TestMigration = DS.IndexedDBMigration.extend({
    migrations: function() {
      this.addModel(App.Person, {autoIncrement: true});
    }
  });

  migration = TestMigration.create({
    databaseName: databaseName,
    version: 1
  });

  QUnit.stop();
  migration.migrate().then(function() {
    return openDatabase(databaseName);
  }).then(function(db) {
    var stores = db.objectStoreNames,
      transaction = db.transaction("App.Person", 'readwrite'),
      objectStore = transaction.objectStore("App.Person"),
      saveRequest;

    ok(stores.contains("App.Person"), "Person object store created");
    saveRequest = objectStore.add({name: "Test"});
    saveRequest.onsuccess = function(event) {
      var source = event.target.source;

      equal(source.keyPath, "id", "Object store's id field is 'id'");
      ok(source.autoIncrement, "Object store is auto increment");
      equal(source.name, "App.Person", "Object store has correct name");


      objectStore.get(1).onsuccess = function() {
        equal(this.result.id, 1, "First id was 1");
        equal(this.result.name, "Test", "First name is correct");

        saveRequest = objectStore.add({name: "Test2"});
        saveRequest.onsuccess = function(event) {
          equal(this.result, 2, "Second id was 2");

          db.close();
          QUnit.start();
        };
      };
    };

    saveRequest.onerror = function(err) {
      console.error(err);
      db.close();
      QUnit.start();
    };
  });
});
