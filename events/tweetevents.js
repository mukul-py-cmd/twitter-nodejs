const EventEmitter = require('events');
const { findAndUpdate, indexNewTweet } = require('../helper/contentSearch');
const tweetEmitter = new EventEmitter();

tweetEmitter.on('newTweet', (doc) => {
  indexNewTweet(doc);
});

tweetEmitter.on('modifiedTweet', (doc) => {
  findAndUpdate(doc);
});

exports.tweetEmitter = tweetEmitter;
