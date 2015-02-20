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
  createRecord: function (store, type, record) {
    var modelName = type.typeKey;
    var data = record.serialize();
    var self = this;

    return new Ember.RSVP.Promise(function (resolve, reject) {

      self.openDatabase().then(function (conn) {
        var transaction = conn.transaction(modelName, 'readwrite');
        var objectStore = transaction.objectStore(modelName);
        var request = objectStore.add(data);
        var id;

        transaction.oncomplete = function () {
          conn.close();
          record.id = id;
          resolve();
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
  find: function (store, type, id, record) {
    console.log(record);

    var self = this;
    var modelName = type.typeKey;

    return new Ember.RSVP.Promise(function (resolve, reject) {
      self.openDatabase().then(function (conn) {
        var transaction = conn.transaction(modelName, 'readonly');
        var objectStore = transaction.objectStore(modelName);
        var request = objectStore.get(id);

        transaction.onerror = function (event) {
          console.error(event);
        };

        request.onsuccess = function (event) {
          var result = event.target.result;
          console.log(event);
          conn.close();
          resolve(result);
        };

        request.onerror = function (event) {
          console.error(event);
          conn.close();
          reject(event);
        };

      });
    });
  },
  findAll: function (store, type, sinceToken) {

    var query;

    if (sinceToken) {
      query = {since: sinceToken};
    }
    return [];
  },
  toString: function () {
    return 'EmberIDBAdapter';
  }
});
