import Ember from 'ember';
import DS from 'ember-data';

import IndexedDBSerializer from 'indexdb-adapter/serializers/indexed-db';

export function openDatabase(databaseName) {
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
}

export function deleteDatabase(databaseName) {
  return new Ember.RSVP.Promise(function (resolve, reject) {
    var deletion = indexedDB.deleteDatabase(databaseName);
    deletion.onsuccess = function () {
      resolve();
    };
    deletion.onerror = function (err) {
      console.log('Problem deleting database:');
      console.log(err);
      reject();
    };
  });
}

//export function setupStore(options) {
//  var container, registry;
//  var emberChannel = QUnit.urlParams.emberChannel || 'release';
//
//  var env = {};
//  options = options || {};
//
//  if (emberChannel.match(/^beta|canary$/i)) {
//    registry = env.registry = new Ember.Registry();
//    container = env.container = registry.container();
//  } else {
//    container = env.container = new Ember.Container();
//    registry = env.registry = container;
//  }
//
//  env.replaceContainerNormalize = function replaceContainerNormalize(fn) {
//    if (env.registry) {
//      env.registry.normalize = fn;
//    } else {
//      env.container.normalize = fn;
//    }
//  };
//
//  var adapter = env.adapter = (options.adapter || DS.Adapter);
//  delete options.adapter;
//
//  for (var prop in options) {
//    registry.register('model:' + prop, options[prop]);
//  }
//
//  registry.register('store:main', DS.Store.extend({
//    adapter: adapter
//  }));
//
//  registry.register('serializer:application', DS.JSONSerializer);
//  registry.register('adapter:-rest', DS.RESTAdapter);
//
//  registry.injection('serializer', 'store', 'store:main');
//
//  env.serializer = container.lookup('serializer:application');
//  env.store = container.lookup('store:main');
//  env.adapter = env.store.get('defaultAdapter');
//
//  return env;
//}

export function setupStore (options) {
  var env = {};
  options = options || {};

  DS.IndexedDBSerializer = DS.JSONSerializer.extend();

  var container = env.container = new Ember.Container();

  var adapter = env.adapter = (options.adapter || DS.Adapter);
  delete options.adapter;

  for (var prop in options) {
    container.register('model:' + prop, options[prop]);
  }

  container.register('store:main', DS.Store.extend({
    adapter: adapter
  }));

  container.register('serializer:application', DS.IndexedDBSerializer.extend());

  container.injection('serializer', 'store', 'store:main');

  env.serializer = container.lookup('serializer:application');
  env.store = container.lookup('store:main');
  env.adapter = env.store.get('defaultAdapter');

  return env;
}

