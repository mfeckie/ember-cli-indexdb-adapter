import DS from 'ember-data';
import Ember from 'ember';

export default DS.Adapter.extend({
  databaseName: 'Ember-IDBAdapter',
  version: 1,
  init: function () {
    //this.openDatabase();
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
  addModel: function (modelName) {
    var self = this;

    return new Ember.RSVP.Promise(function (resolve, reject) {

      var newVersion = self.get('version') + 1;
      self.set('version', newVersion);
      var conn = indexedDB.open(self.get('databaseName'), newVersion);
      conn.onsuccess = function (event) {
        event.target.result.close();
        Ember.run(function () {
          resolve();
        });
      };
      conn.onupgradeneeded = function (event) {
        var db = event.target.result;
        Ember.run(function () {
          db.createObjectStore(modelName);
          resolve();
        });
      };
      conn.onerror = function (event) {
        console.log('Error', event);
        Ember.run(function () {
          reject();
        });
      };
    });
  }
});
