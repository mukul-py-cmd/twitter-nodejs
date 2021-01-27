const EventEmitter = require('events');
const { findAndUpdate, indexNewUser } = require('../helper/userSearch');
const userEmitter = new EventEmitter();

userEmitter.on('newUser', (doc) => {
  indexNewUser(doc);
});

userEmitter.on('modifiedUser', (doc) => {
  findAndUpdate(doc);
});

exports.userEmitter = userEmitter;
