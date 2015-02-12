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
          self.set('memoizedDatabaseForUpgrade', event.target.result);
          self.runMigrations();
          self.set('memoizedDatabaseForUpgrade', null);
        });
      };

      connection.onerror = function (err) {
        console.log('Error connecting to ', self.databaseName);
        console.error('Error: ', err);
        reject(err);
      };
    });
  },
  addModel: function (modelName, opts) {
    var db = this.get('memoizedDatabaseForUpgrade');
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
  }
});




export default DS.Adapter.extend({

});
