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

var adapter, App = {}, mock, payload, result, expected,
  databaseName = "AdapterTest";

App.Dave = DS.Model.extend({
  name: DS.attr('string')
});

moduleFor('adapter:indexed-db', 'IndexedDB Adapter', {
  setup: function () {
    //QUnit.stop();
    //var self = this;
    //Ember.run(function() {
    //  var TestAdapter = self.container.registry['adapter:indexed-db'].extend();
    //  TestAdapter.version = 1;
    //  TestAdapter.databaseName = databaseName;
    //  TestAdapter.migrations = function () {
    //    this.addModel(App.Dave);
    //  };
    //  mock = null;
    //  adapter = TestAdapter.create();
    //  QUnit.start();
    //});
  },
  teardown: function () {
    deleteDatabase(databaseName);
  }
});

//test('#addEmbeddedPayload builds _embedded object', function() {
//  var relationshipRecord;
//
//  payload = { id: "1", customer: "2" };
//  relationshipRecord = { id: "2", name: "Rambo" };
//  expected = {
//    id: "1",
//    customer: "2",
//    _embedded: {
//      customer: { id: "2", name: "Rambo" }
//    }
//  };
//
//  result = adapter.addEmbeddedPayload(payload, 'customer', relationshipRecord);
//
//  deepEqual(result, expected, "Embedded payload has the correct format");
//});
//
//test("#addEmbeddedPayload builds _embedded array and repopulates hasMany relation's ids", function() {
//  var relationshipRecord;
//
//  payload = { id: "1", customers: ["2"] };
//  relationshipRecord = [{ id: "2", name: "Rambo" }, { id: "3", name: "Braddock" }];
//  expected = {
//    id: "1",
//    customers: ["2", "3"],
//    _embedded: {
//      customers: [{ id: "2", name: "Rambo" }, { id: "3", name: "Braddock" }]
//    }
//  };
//
//  result = adapter.addEmbeddedPayload(payload, 'customers', relationshipRecord);
//
//  deepEqual(result, expected, "Embedded payload has the correct format");
//});
//
//test("#addEmbeddedPayload doesn't delete belongsTo relation on empty array", function() {
//  var relationshipRecord;
//
//  payload = { id: "1", customer: "2" };
//  relationshipRecord = [];
//  expected = { id: "1", customer: "2" };
//
//  result = adapter.addEmbeddedPayload(payload, 'customer', relationshipRecord);
//
//  deepEqual(result, expected, "Embedded payload has the correct format");
//});
//
//test("#addEmbeddedPayload doesn't delete hasMany relation on empty array", function() {
//  var relationshipRecord, a;
//
//  payload = { id: "1", customers: ["2", a] };
//  relationshipRecord = [];
//  expected = { id: "1", customers: ["2"] };
//
//  result = adapter.addEmbeddedPayload(payload, 'customers', relationshipRecord);
//
//  deepEqual(result, expected, "Embedded payload has the correct format");
//});
//
//test("#addEmbeddedPayload doesn't delete relation on empty relation", function() {
//  var relationshipRecord;
//
//  payload = { id: "1", customer: "2" };
//  relationshipRecord = {};
//  expected = { id: "1", customer: "2" };
//
//  result = adapter.addEmbeddedPayload(payload, 'customer', relationshipRecord);
//
//  deepEqual(result, expected, "Embedded payload has the correct format");
//});
//
//test("#addEmbeddedPayload doesn't delete relation when relation has no IDs", function() {
//  var relationshipRecord;
//
//  payload = { id: "1", customer: "2" };
//  relationshipRecord = { name: "Rambo" };
//  expected = { id: "1", customer: "2" };
//
//  result = adapter.addEmbeddedPayload(payload, 'customer', relationshipRecord);
//
//  deepEqual(result, expected, "Embedded payload has the correct format");
//});

test("#createRecord should not serialize ID if it's autoIncrement", function() {
  var env, store;
  expect(4);

  QUnit.stop();
  deleteDatabase(databaseName).then(function() {
    App.Person = DS.Model.extend({ name: DS.attr('string') });
    App.Person.toString = function() { return "App.Person"; };

    return new Ember.RSVP.Promise(function(resolve, reject) {

      var Adapter = IndexedDbAdapter.extend({
        databaseName: databaseName,
        version: 1,
        migrations: function() {
          console.log('Migrations');

          this.addModel(App.Person, {autoIncrement: true});
          resolve(store);
        }
      });

      window.Adapter = Adapter;

      env = setupStore({
        person: App.Person,
        adapter: Adapter
      });

      store = env.store;
    });
  }).then(function() {

    var newPerson = store.createRecord('person', { name: 'Billie Jean' }),
      adapter = store.adapter.create();

    adapter.createRecord(null, App.Person, newPerson).then(function(person) {
      newPerson.deleteRecord();

      return store.findAll('person');
    }).then(function(people) {
      var person1 = people.objectAt(0);

      equal(Ember.get(person1, 'id'),   1,             'id is loaded correctly');
      equal(Ember.get(person1, 'name'), 'Billie Jean', 'name is loaded correctly');

      newPerson = store.createRecord('person', { name: 'Billie Jeans' });
      return adapter.createRecord(null, App.Person, newPerson);
    }, function() {
      ok(false, "Person is saved");
      QUnit.start();
    }).then(function(person) {
      newPerson.deleteRecord();

      store.findAll('person').then(function(people) {
        var person1 = people.objectAt(1);

        equal(Ember.get(person1, 'id'),   2,             'id is loaded correctly');
        equal(Ember.get(person1, 'name'), 'Billie Jeans', 'name is loaded correctly');
        QUnit.start();
      }, function() {
        ok(false, "Person is saved");
        QUnit.start();
      });
    });
  }, function () {
    console.log('rejected');
    QUnit.start();
  });
});

