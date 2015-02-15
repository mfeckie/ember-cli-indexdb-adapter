import DS from 'ember-data';
import Ember from 'ember';

DS.IndexedDBMigration = Ember.Object.extend({
  databaseName: '_default',
  version: 1,
  migrate: function () {
    console.log('Called migrate()');

    var self = this;

    return new Ember.RSVP.Promise(function (resolve, reject) {
      console.log('Promise');

      var connection = indexedDB.open(self.databaseName, self.version);

      connection.onsuccess = function () {
        console.log('On success');

        var result = this.result;
        console.log(result);

        Ember.run(function () {
          result.close();
          resolve();
        });
      };

      connection.onupgradeneeded = function (event) {
        console.log('in on upgrade');

        Ember.run(function () {
          var dbToUpgrade = 'dbToUpgrade';
          self.set(dbToUpgrade, event.target.result);
          self.runMigrations();
          self.set(dbToUpgrade, null);
        });
      };

      connection.onerror = function (event) {
        window.ev = event;
        console.log('Error connecting to ', self.databaseName);
        console.log('Error migrating: ', event.target.error.message);
        reject(event);
      };
    });
  },
  addModel: function (modelName, opts) {
    var db = this.get('dbToUpgrade');
    var options = opts || {};

    Ember.run(function () {
      if (!db.objectStoreNames.contains(modelName)) {
        var keyOpts = {keyPath: 'id'};

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
    var self = this;
    this.get('migration').set('databaseName', this.databaseName);
    this.get('migration').set('migrations', this.get('migrations'));
    this.get('migration').set('version', this.get('version'));

    if (!self.get('smartSearch')) {
      self.set('smartSearch', false);
    }

    self.get('migration').migrate();
  },
  migration: DS.IndexedDBMigration.create(),
  addEmbeddedPayload: function (payload, relationshipName, relationshipRecord) {

    var objectHasId = (relationshipRecord && relationshipRecord.id),
      arrayHasIds = (relationshipRecord.length && relationshipRecord.everyBy("id")),
      isValidRelationship = (objectHasId || arrayHasIds);

    if (isValidRelationship) {
      if (!payload['_embedded']) {
        payload['_embedded'] = {};
      }

      payload['_embedded'][relationshipName] = relationshipRecord;
      if (relationshipRecord.length) {
        payload[relationshipName] = relationshipRecord.mapBy('id');
      } else {
        payload[relationshipName] = relationshipRecord.id;
      }
    }
    if (Ember.isArray(payload[relationshipName])) {
      payload[relationshipName] = payload[relationshipName].filter(function (id) {
        return id;
      });
    }
    return payload;
  }
});
