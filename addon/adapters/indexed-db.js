import DS from 'ember-data';
import Ember from 'ember';

export default DS.Adapter.extend({
  databaseName: 'Ember-IDBAdapter',
  version: 1,
  init: function () {
    var self = this;
    this.openDatabase().then(function (db) {
      db.close();
    }, function (err) {
      console.log(err);
    }).then(function () {
      if (self.models.length > 0) {
        self.models.forEach(function (model) {
          self.addModel(model);
        });
      }
    });
  },
  openDatabase: function () {
    var self = this;
    return new Ember.RSVP.Promise(function (resolve, reject) {
      var openRequest = indexedDB.open(self.get('databaseName'), self.get('version'));

      openRequest.onsuccess = function (event) {
        Ember.run(function () {
          resolve(event.target.result);
        });
      };
      openRequest.onerror = function (event) {
        Ember.run(function () {
          console.error(event);
          reject(event);
        });
      };
    });
  },
  models: [],
  addModel: function (modelName) {
    var self = this;

    return new Ember.RSVP.Promise(function (resolve, reject) {
      var newVersion = self.get('version') + 1;
      self.set('version', newVersion);
      var conn = indexedDB.open(self.get('databaseName'), newVersion);

      conn.onsuccess = function (event) {
        Ember.run(function () {
          resolve(event);
          event.target.result.close();
        });
      };

      conn.onupgradeneeded = function (event) {
        var db = event.target.result;
        Ember.run(function () {
          db.createObjectStore(modelName, {autoIncrement: true, keyPath: 'id'});
        });
      };

      conn.onerror = function (event) {
        console.log('Error', event);
        Ember.run(function () {
          reject(event);
        });
      };
    });

  },
  saveToIndexedDB: function (modelName, record) {

    var self = this;
    return new Ember.RSVP.Promise(function (resolve, reject) {

      self.openDatabase().then(function (conn) {
        var transaction = conn.transaction(modelName, 'readwrite');
        var objectStore = transaction.objectStore(modelName);
        var request = objectStore.add(record);
        var id;

        transaction.oncomplete = function () {
          conn.close();
          resolve(id);
        };

        request.onsuccess = function (event) {
          id = event.target.result;
        };

        request.onerror = function (event) {
          console.error(event);
          reject(event);
        };
      });
    });
  },
  toString: function () {
    return 'EmberIDBAdapter';
  }
});
