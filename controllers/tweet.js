const path = require('path');
const { v4: uuidv4 } = require('uuid');
var createError = require('http-errors');
const mongoose = require('mongoose');
const tweetModel = require('../models/tweet');
const userAuth = require('../models/user');
const s3 = require('../helper/aws-s3');
const pagination = require('../helper/pagination');
const log = require('../lib/logger');

module.exports = function (services, config, utils) {
  return {
    post: async (req, res, next) => {
      // var tweet = new tweetModel(req.body);
      // tweet = await tweet.save();

      try {
        utils.isLoggedIn(req);
        const user_id = req.userid._id;
        const { message } = req.body;
        var new_tweet = new tweetModel({ message: message });

        //handling media files
        var awsMediaKeys = [];
        if (req.files && req.files.imagelinks) {
          var uploadFilePromises = [];
          req.files.imagelinks.forEach((v) => {
            const fileName = `tweetimage/${uuidv4()}/${path.basename(
              v.originalname
            )}`;
            awsMediaKeys.push(fileName);
            uploadFilePromises.push(s3.upload(fileName, v.buffer));
          });
          const image_endpoints = await Promise.all(uploadFilePromises);
          new_tweet.imagelinks = image_endpoints;
          new_tweet.awsMediaKeys = awsMediaKeys;
        } else if (req.files && req.files.videolinks) {
          const fileName = `tweetvideo/${uuidv4()}/${path.basename(
            req.files.videolinks[0].originalname
          )}`;
          awsMediaKeys.push(fileName);
          const videoendpoint = await s3.upload(
            fileName,
            req.files.videolinks[0].buffer
          );
          new_tweet.videolinks = videoendpoint;
          new_tweet.awsMediaKeys = awsMediaKeys;
        }
        //console.log(new_tweet)
        new_tweet.author = user_id;
        new_tweet = await new_tweet.save();
        var to_return = new_tweet.toObject();
        delete to_return.__v;
        delete to_return.awsMediaKeys;
        delete to_return.likes;
        return res.status(200).json({
          status: 200,
          message: to_return,
        });
      } catch (error) {
        return next(error);
      }
    },

    display: async (req, res, next) => {
      // tweet = await tweetModel.find().populate({path:'author',select:'username profile.profilePic'});
      //console.log(tweet)
      //log({ req, res }, 'info');
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        var tweets = await pagination.paginate(
          tweetModel,
          page,
          limit,
          '-__v -awsMediaKeys -comments'
        );
        const authorid_array = tweets.map((v) => {
          //adding whether the user have likes a tweet flag
          v.like_flag = false;
          if (req.userid) {
            for (let i = 0; i < v.likes.length; i++) {
              if (req.userid._id == v.likes[i]) {
                v.like_flag = true;
              }
            }
          }
          delete v.likes;
          return v.author;
        });
        const users = await userAuth
          .find({ _id: { $in: authorid_array } })
          .select('name username profile.profilePic')
          .lean();

        return res.status(200).json({
          message: {
            tweets,
            users,
          },
        });
      } catch (error) {
        return next(error);
      }
    },
    display_user_tweets: async (req, res, next) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        var tweets = await pagination.paginate(
          tweetModel,
          page,
          limit,
          '-__v -awsMediaKeys -comments',
          (sortBy = { updatedAt: -1 }),
          (filter = { author: req.query.userid })
        );
        tweets.forEach((v) => {
          //console.log(typeof(req.userid._id),typeof(v.likes));
          v.like_flag = false;
          if (req.userid) {
            for (let i = 0; i < v.likes.length; i++) {
              if (req.userid._id == v.likes[i]) {
                v.like_flag = true;
              }
            }
          }
          delete v.likes;
        });
        //tweetModel.find({ author: req.query.userid }).select('-__v -awsMediaKeys').limit(20).sort({ updatedAt: -1 }).lean();
        //console.log(tweets);
        // const authorid_array = tweets.map((v) => {
        //     return v.author;
        // })
        //const users = await userAuth.find({ _id: { $in: authorid_array } }).select('name username profile.profilePic').lean();

        return res.status(200).json({
          message: tweets,
        });
      } catch (error) {
        return next(error);
      }
    },
    update_tweet: async (req, res, next) => {
      try {
        utils.isLoggedIn(req);
        const { message } = req.body;
        const tweet_id = req.query.tweet_id;
        var tweet_doc = await tweetModel.findById(tweet_id);
        if (!tweet_doc) {
          const err = new Error('Could not find the tweet.');
          err.status = 300;
          return next(err);
        }

        try {
          await utils.isOwnerPermission(req, tweet_doc, 'author');
        } catch (error) {
          return next(error);
        }
        tweet_doc.message = message;
        tweet_doc = await tweet_doc.save();
        var to_return = tweet_doc.toObject();
        delete to_return.__v;
        delete to_return.awsMediaKeys;
        delete to_return.likes;
        return res.status(200).json({
          status: 200,
          message: to_return,
        });
        // tweetModel.update({ $and: [{ _id: tweet_id }, { author: user_id }] }, { $set: { message: message } }, (err, doc) => {
        //     if (err) {
        //         return next(err);
        //     } else {
        //         res.status(200).json(doc);
        //     }
        // });
      } catch (error) {
        //console.log(error);
        return next(error);
      }
    },
    delete_tweet: async (req, res, next) => {
      try {
        utils.isLoggedIn(req);
        const tweet_id = req.query.tweet_id;
        if (!tweet_id) {
          return next(createError(400, 'Provide with a tweet id'));
        }
        var tweet_doc = await tweetModel.findById(tweet_id);

        if (tweet_doc) {
          //check delete obj permission
          try {
            await utils.isOwnerPermission(req, tweet_doc, 'author');
          } catch (error) {
            return next(error);
          }
          //First delete tweet =>on success delete aws media too.
          tweetModel.deleteOne({ _id: tweet_id }, (err) => {
            if (err) {
              return next(err);
            } else {
              //delete media and send response;
              var media_array = [];
              tweet_doc.awsMediaKeys.forEach((v) => {
                media_array.push({ Key: v });
              });
              if (media_array.length > 0) {
                s3.deleteMany(media_array);
              }

              return res
                .status(200)
                .json('Tweet has been deleted successfully');
            }
          });
        } else {
          const err = new Error('Could not find the tweet.');
          err.status = 404;
          return next(err);
        }
      } catch (error) {
        return next(error);
      }
    },
    tweet_like: (req, res, next) => {
      try {
        utils.isLoggedIn(req);
        const { _id: tweet_id, flag } = req.body;
        if (!tweet_id || !flag) {
          return next(createError(400, 'Bad request Data missing'));
        }
        //flag = 1 in request => like the post // -1 implies unlike the post
        const tweet_liked_byid = req.userid._id;
        if (flag == 1) {
          //to like the tweet
          tweetModel.updateOne(
            { _id: tweet_id, likes: { $nin: tweet_liked_byid } },
            { $inc: { likescount: 1 }, $push: { likes: tweet_liked_byid } },
            async (err, upd) => {
              if (err) {
                return next(createError(500, 'Internal Server error'));
              } else {
                if (upd.nModified === 1) {
                  const tweet_doc = await tweetModel
                    .findById(tweet_id)
                    .select('likescount')
                    .lean();
                  return res.status(200).json({
                    message: 'Like successfull',
                    flag: 1,
                    tweet_doc,
                  });
                } else {
                  return res.status(200).json({
                    message: 'Tweet already liked',
                    flag: 1,
                  });
                }
              }
            }
          );
        } else if (flag == -1) {
          tweetModel.updateOne(
            { _id: tweet_id, likes: { $in: tweet_liked_byid } },
            { $inc: { likescount: -1 }, $pull: { likes: tweet_liked_byid } },
            async (err, upd) => {
              if (err) {
                return next(createError(500, 'Internal Server error'));
              } else {
                if (upd.nModified === 1) {
                  const tweet_doc = await tweetModel
                    .findById(tweet_id)
                    .select('likescount')
                    .lean();
                  return res.status(200).json({
                    message: 'UnLike successfull',
                    flag: -1,
                    tweet_doc,
                  });
                } else {
                  return res.status(200).json({
                    message: 'Tweet already Unliked',
                    flag: -1,
                  });
                }
              }
            }
          );
        }
      } catch (error) {
        return next(error);
      }
    },
    get_like_list: async (req, res, next) => {
      try {
        const { _id, page } = req.query;
        const paginate_options = {
          projections: 'likes',
          filter: { _id },
        };
        var tweet_likes = await pagination.paginateNew(
          tweetModel,
          page,
          paginate_options
        );
        if (tweet_likes.length > 0 && tweet_likes[0].likes.length > 0) {
          const users = await userAuth
            .find({ _id: { $in: tweet_likes[0].likes } })
            .select('-password -__v')
            .lean();
          return res.json(users);
        } else {
          return next(createError(404, 'Can not find likes/tweet'));
        }
      } catch (error) {
        console.log(error);
        return next(createError(500, 'Internal server error'));
      }
    },
    addComment: (req, res, next) => {
      try {
        utils.isLoggedIn(req);
        const { _id: tweet_id, parentid, threadlevel } = req.query;
        const commentorid = req.userid._id;
        const commentDoc = {
          commentorid,
          text: req.body.text,
          threadlevel,
          parentid,
        };
        const commentUpdateFunction = async function (err, upd) {
          if (err || upd.nModified !== 1) {
            console.log(err, upd);
            return next(createError(500, 'Internal Server error'));
          } else {
            if (threadlevel == 1) {
              //if threadlevel1 updates done in one update would create path conflict
              await tweetModel.updateOne(
                {
                  _id: tweet_id,
                },
                {
                  //$inc: { commentscount: 1, 'comments.$.commentscount': 1 },
                  $push: { comments: commentDoc },
                }
              );
            }
            //changenew this return ;
            tweetModel.findById(tweet_id, (err, doc) => {
              res.json(doc);
            });
          }
        };
        //add comment at the right level, increase comment count at both places and return *
        if (threadlevel == 0) {
          tweetModel.updateOne(
            { _id: tweet_id },
            { $inc: { commentscount: 1 }, $push: { comments: commentDoc } },
            commentUpdateFunction
          );
        } else if (threadlevel == 1) {
          tweetModel.updateOne(
            {
              _id: tweet_id,
              'comments._id': parentid,
            },
            {
              $inc: { commentscount: 1, 'comments.$.commentscount': 1 },
              //$push: { comments: commentDoc },
            },
            commentUpdateFunction
          );
        } else {
          return next(createError(400, 'Bad data'));
        }
      } catch (e) {
        console.log(e);
        return next(
          createError(e.status || 500, e.message || 'Internal server error')
        );
      }
    },
    editComment: (req, res, next) => {
      try {
        utils.isLoggedIn(req);
        const { _id: tweet_id, commentid } = req.query;
        const commentorid = req.userid._id;
        const text = req.body.text.trim();
        const commentUpdateFunction = function (err, upd) {
          if (err) {
            console.log(err);
            return next(createError(500, 'Internal Server error'));
          } else {
            if (upd.nModified === 1) {
              //console.log(upd);
              res
                .status(200)
                .json({ message: 'comment updated successfully.' });
            } else {
              res.status(400).json({ message: 'comment could not be updated' });
            }
          }
        };
        tweetModel.updateOne(
          {
            _id: tweet_id,
            comments: { $elemMatch: { _id: commentid, commentorid } },
          },
          { 'comments.$.text': text },
          commentUpdateFunction
        );
      } catch (e) {
        console.log(e);
        return next(
          createError(e.status || 500, e.message || 'Internal server error')
        );
      }
    },
    deleteComment: async (req, res, next) => {
      try {
        utils.isLoggedIn(req);
        //rishabh to check in update/delete whether the user is comment owner.
        const { _id: tweet_id, threadlevel, parentid, commentid } = req.query;
        const commentorid = req.userid._id;
        const commentUpdateFunction = function (err, upd) {
          if (err) {
            console.log(err);
            return next(createError(500, 'Internal Server error'));
          } else {
            if (upd.nModified === 1) {
              //updating comments count in parent comment and tweetcommentscount
              if (threadlevel == 1) {
                tweetModel
                  .updateOne(
                    {
                      _id: tweet_id,
                      'comments._id': parentid,
                    },
                    {
                      $inc: {
                        commentscount: -1,
                        'comments.$.commentscount': -1,
                      },
                    }
                  )
                  .exec();
              }
              console.log(upd);
              res
                .status(200)
                .json({ message: 'comment deleted successfully.' });
            } else {
              res.status(400).json({ message: 'comment could not be deleted' });
            }
          }
        };

        if (threadlevel == 0) {
          //https://docs.mongodb.com/manual/reference/operator/projection/positional/
          let commentDoc = await tweetModel
            .findOne({ _id: tweet_id, 'comments._id': commentid })
            .select('comments.$ -_id')
            .lean();
          //console.log(commentDoc);
          const commentcount =
            commentDoc &&
            commentDoc.comments &&
            commentDoc.comments[0].commentscount
              ? commentDoc.comments[0].commentscount
              : 0;
          console.log(commentcount);
          tweetModel.updateOne(
            {
              _id: tweet_id,
              comments: {
                $elemMatch: { _id: commentid, commentorid, threadlevel },
              },
            },
            {
              $inc: { commentscount: -1 * commentcount },
              $pull: {
                comments: {
                  $or: [{ _id: commentid }, { parentid: commentid }],
                },
              },
            },
            commentUpdateFunction
          );
        } else if (threadlevel == 1) {
          tweetModel.updateOne(
            {
              _id: tweet_id,
              comments: {
                $elemMatch: {
                  _id: commentid,
                  commentorid,
                  threadlevel,
                  parentid,
                },
              },
            },
            { $pull: { comments: { _id: commentid } } },
            commentUpdateFunction
          );
        }
      } catch (e) {
        console.log(e);
        return next(
          createError(e.status || 500, e.message || 'Internal server error')
        );
      }
    },
    getComment: async (req, res, next) => {
      try {
        const tweet_id = mongoose.Types.ObjectId(req.query._id);
        const commentDoc = await tweetModel.aggregate([
          { $match: { _id: tweet_id } },
          { $project: { comments: 1, commentscount: 1 } },
          { $unwind: '$comments' },
          // {
          //   $lookup: {
          //     from: 'userauths',
          //     let: {
          //       commentid: '$comments.commentorid',
          //       //comments: '$comments',
          //     },
          //     pipeline: [
          //       { $match: { $expr: { $eq: ['$_id', '$$commentid'] } } },
          //       {
          //         $project: {
          //           _id: 0,
          //           name: 1,
          //           username: 1,
          //           profilePic: '$profile.profilePic',
          //           //'profile.profilePic': 1,
          //           bio: '$profile.bio',
          //         },
          //       },
          //     ],
          //     as: 'profile',
          //   },
          // },
          //{ $replaceRoot: { newRoot: { $arrayElemAt: ['$profile', 0] } } },
          // {
          //   $project: {
          //     'comments.comment': '$comments',
          //     'comments.profile': { $arrayElemAt: ['$profile', 0] },
          //   },
          // },
          // {
          {
            $group: {
              _id: '$comments.parentid',
              comments: {
                $push: '$comments',
              },
              tweetcommentscount: { $first: '$commentscount' },
            },
          },
        ]);
        var usermaps = [];
        commentDoc.forEach((v1) => {
          v1.comments.forEach((v2) => {
            usermaps.push(v2.commentorid);
          });
        });
        //console.log(usermaps);
        const userDoc = await userAuth
          .find({ _id: { $in: usermaps } })
          .select('profile.bio profile.profilePic name username')
          .lean();
        res.status(200).json({ commentDoc, userDoc });
      } catch (e) {
        console.log(e);
        return next(
          createError(e.status || 500, e.message || 'Internal server error')
        );
      }
    },
    getTweetById: (req, res, next) => {
      try {
        const { _id: tweetId } = req.query;
        const userId = req.userid;
        tweetModel
          .findById(tweetId, (err, doc) => {
            if (err) {
              console.log(err);
              return next(createError(500, 'Internal server error'));
            } else {
              if (userId) {
                var like;
                for (like of doc.likes) {
                  if (like == userId._id) {
                    doc.like_flag = true;
                    break;
                  }
                }
              } else {
                doc.like_flag = false;
              }
              delete doc.likes;
              res.status(200).json(doc);
            }
          })
          .select('-__v -awsMediaKeys -comments')
          .lean();
      } catch (e) {
        console.log(e);
        return next(
          createError(e.status || 500, e.message || 'Internal server error')
        );
      }
    },
  };
};
