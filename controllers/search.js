/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-new */
var createError = require('http-errors');
const elasticsearch = require('elasticsearch');
const async = require('async');
const tweetModel = require('../models/tweet');
const userAuth = require('../models/user');

module.exports = function (services, config, utils) {
  //for passing async function to async.series don't use callback. just return a value or throw error
  async function esConnectFunction(esClient) {
    var esConnect = false;
    var maxtries = 0;
    while (!esConnect && maxtries < 5) {
      await new Promise((res) => {
        esClient.ping(
          {
            // ping usually has a 3000ms timeout
            requestTimeout: 1000,
          },
          // eslint-disable-next-line no-loop-func
          function (error) {
            if (error) {
              maxtries += 1;
              res(null, 'fail');
            } else {
              console.log('es connected');
              esConnect = true;
              res(null, 'success');
            }
          }
        );
      });
    }
    if (esConnect) {
      return true;
    } else {
      throw createError(500, 'Internal Server Error');
    }
  }
  async function fetchUserProfile(contents) {
    var userIdArray = contents.map((element) => {
      //element.like_flag = false;
      return element.author;
    });
    const users = await userAuth
      .find({ _id: { $in: userIdArray } })
      .select('name username profile.profilePic profile.bio')
      .lean();
    var usersDict = {};
    users.forEach((element) => {
      usersDict[element._id] = element;
    });
    return usersDict;
  }
  async function fetchTweets(contents, userid) {
    var tweetIdArray = contents.map((element) => {
      return element.tweetId;
    });
    const tweets = await tweetModel
      .find({ _id: { $in: tweetIdArray } })
      .select('-__v -awsMediaKeys -comments')
      .lean();
    tweets.forEach((v) => {
      //adding whether the user have likes a tweet flag
      v.like_flag = false;
      if (userid) {
        for (let i = 0; i < v.likes.length; i++) {
          if (userid._id == v.likes[i]) {
            v.like_flag = true;
          }
        }
      }
    });
    return tweets;
  }
  return {
    userSearch: async (req, res, next) => {
      try {
        //expecting query, last sort value,
        var esClient = new elasticsearch.Client({
          host: process.env.esSearchURL,
        });
        var { text, searchAfterText } = req.query;
        //console.log(JSON.parse(searchAfterText));
        text = text.trim();
        var query = {
          index: 'user_profile_index',
          body: {
            //from: 0,
            size: 10,
            query: {
              bool: {
                must: {
                  multi_match: {
                    query: text,
                    type: 'phrase_prefix',
                    fields: ['name^5', 'userName', 'bio^2'],
                  },
                },
                //filter: filter,
              },
            },
            //_source: ['name', 'scid', 'description', 'slug'],
            sort: { 'userName.raw': 'asc' },
          },
        };
        if (searchAfterText) {
          query.body.search_after = JSON.parse(searchAfterText);
        }
        //console.log(query);
        async.series(
          [
            esConnectFunction.bind(null, esClient),
            async function () {
              const res = await esClient.search(query);
              return res;
            },
          ],
          function (err, results) {
            if (err) {
              return next(createError(err.status || 500, err.message));
            }
            // console.log(results[1].hits.total.value);
            // console.log(results[1].hits.hits);
            if (
              results[1] &&
              results[1].hits.hits &&
              results[1].hits.hits.length > 0
            ) {
              const users = results[1].hits.hits.map((element) => {
                return element._source;
              });
              searchAfterText =
                results[1].hits.hits[results[1].hits.hits.length - 1].sort;
              return res.status(200).json({ searchAfterText, users });
            } else {
              return res
                .status(404)
                .json({ message: 'No user found', users: [] });
            }
          }
        );
      } catch (error) {
        return next(createError(error.status || 500, error.message));
      }
    },
    contentSearch: (req, res, next) => {
      try {
        var esClient = new elasticsearch.Client({
          host: process.env.esSearchURL,
        });
        var { text, searchAfterText } = req.query;
        text = text.trim();
        //console.log(text);
        var query = {
          index: 'content_search_index',
          body: {
            //from: 0,
            size: 10,
            query: {
              match: {
                message: {
                  query: text,
                  lenient: true,
                  //minimum_should_match: 3,
                },
              },
            },
            //_source: ['name', 'scid', 'description', 'slug'],
            sort: { lastUpdated: 'desc', tweetId: 'asc' },
          },
        };

        if (searchAfterText) {
          query.body.search_after = JSON.parse(searchAfterText);
        }
        async.series(
          [
            esConnectFunction.bind(null, esClient),
            async function () {
              const res = await esClient.search(query);
              //console.log({ res });
              return res;
            },
          ],
          function (err, results) {
            if (err) {
              //console.log(err.body.error.root_cause);
              return next(createError(err.status || 500, err.message));
            }
            // console.log(results[1].hits.total.value);
            //console.log(results[1].hits);
            if (
              results[1] &&
              results[1].hits.hits &&
              results[1].hits.hits.length > 0
            ) {
              const contents = results[1].hits.hits.map((element) => {
                return element._source;
              });
              searchAfterText =
                results[1].hits.hits[results[1].hits.hits.length - 1].sort;
              async.parallel(
                {
                  one: fetchUserProfile.bind(null, contents),
                  two: fetchTweets.bind(null, contents, req.userid),
                },
                function (e, results) {
                  if (e) {
                    return next(createError(e.status || 500, e.message));
                  }
                  return res.status(200).json({
                    searchAfterText,
                    users: results.one,
                    tweets: results.two,
                  });
                }
              );
            } else {
              return res
                .status(404)
                .json({ message: 'No user found', users: [], tweets: [] });
            }
          }
        );
      } catch (error) {
        //console.log(error);
        return next(createError(error.status || 500, error.message));
      }
    },
  };
};
