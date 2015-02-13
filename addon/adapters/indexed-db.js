import DS from 'ember-data';
import Ember from 'ember';

DS.IndexedDBMigration = Ember.Object.extend({
  databaseName: '_default',
  version: 1,
  migrate: function () {
    var self = this;

    return new Ember.RSVP.Promise(function (resolve, reject) {
      var connection = indexedDB.open(self.databaseName, self.version);
      connection.onsuccess = function () {
        var result = this.result;
        Ember.run(function () {
          result.close();
          resolve();
        });
      };

      connection.onupgradeneeded = function (event) {
        Ember.run(function () {
          var dbToUpgrade = 'dbToUpgrade';
          self.set(dbToUpgrade, event.target.result);
          self.runMigrations();
          self.set(dbToUpgrade, null);
        });
      };

      connection.onerror = function (event) {
        console.log('Error connecting to ', self.databaseName);
        console.log('Error migrating: ', event.target.error.message);
        reject(event);
      };
    });
  },
  addModel: function (modelName, opts) {
    console.log('Called addModel with: ', modelName);

    var db = this.get('dbToUpgrade');
    var options = opts || {};

    Ember.run(function () {
      if (!db.objectStoreNames.contains(modelName)) {
        var keyOpts = { keyPath: 'id'};

        if (options.autoIncrement) {
          keyOpts.autoIncrement = options.autoIncrement;
        }

        if (options.keyPath) {
          keyOpts.keyPath = options.keyPath;
        }

        db.createObjectStore(modelName, keyOpts);
      }
    });
  },
  runMigrations: function () {
    this.migrations.call(this);
  },
  dbToUpgrade: null
});

export default DS.Adapter.extend({
  databaseName: 'IDBAdapter',
  version: 1,
  init: function () {
  },
  migration: DS.IndexedDBMigration.extend()
});
