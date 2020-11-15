
const { message } = require('../helper/userauthvalid');
const tweetModel = require('../models/tweet');
const userAuth = require('../models/user');
const s3 = require('../helper/aws-s3');
const pagination = require('../helper/pagination');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
//delete media from s3 on updation/deletion of docs.
//morgan,helmet,cors
//add pagination
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
                        const fileName = `tweetimage/${uuidv4()}/${path.basename(v.originalname)}`;
                        awsMediaKeys.push(fileName);
                        uploadFilePromises.push(s3.upload(fileName, v.buffer));
                    });
                    const image_endpoints = await Promise.all(uploadFilePromises);
                    new_tweet.imagelinks = image_endpoints;
                    new_tweet.awsMediaKeys = awsMediaKeys;
                } else if (req.files && req.files.videolinks) {
                    const fileName = `tweetvideo/${uuidv4()}/${path.basename(req.files.videolinks.originalname)}`;
                    awsMediaKeys.push(fileName);
                    const videoendpoint = await s3.upload(fileName, req.files.videolinks.buffer);
                    new_tweet.videolinks = videoendpoint;
                    new_tweet.awsMediaKeys = awsMediaKeys;
                }
                //console.log(new_tweet)
                new_tweet.author = user_id;
                new_tweet = await new_tweet.save();
                var to_return = new_tweet.toObject();
                delete to_return.__v;
                delete to_return.awsMediaKeys;
                return res.status(200).json({
                    status: 200,
                    message: to_return
                })
            } catch (error) {
                return next(error);
            }

        },

        display: async (req, res, next) => {
            // tweet = await tweetModel.find().populate({path:'author',select:'username profile.profilePic'});
            //console.log(tweet)
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                var tweets = await pagination.paginate(tweetModel, page, limit, '-__v -awsMediaKeys');
                const authorid_array = tweets.map((v) => {
                    return v.author;
                })
                const users = await userAuth.find({ _id: { $in: authorid_array } }).select('name username profile.profilePic').lean();

                return res.status(200).json({
                    message: {
                        tweets,
                        users
                    }
                });
            } catch (error) {
                return next(error)
            }

        },
        display_user_tweets: async (req, res, next) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                var tweets = await pagination.paginate(tweetModel, page, limit, '-__v -awsMediaKeys', sortBy = { updatedAt: -1 }, filter = { author: req.query.userid });
                //tweetModel.find({ author: req.query.userid }).select('-__v -awsMediaKeys').limit(20).sort({ updatedAt: -1 }).lean();
                //console.log(tweets);
                // const authorid_array = tweets.map((v) => {
                //     return v.author;
                // })
                //const users = await userAuth.find({ _id: { $in: authorid_array } }).select('name username profile.profilePic').lean();

                return res.status(200).json({
                    message: tweets
                });
            } catch (error) {
                return next(error)
            }
        },
        update_tweet: async (req, res, next) => {
            try {
                utils.isLoggedIn(req);
                const user_id = req.userid._id;
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
                return res.status(200).json({
                    status: 200,
                    message: to_return
                })
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
                    const err = new Error('Provide with a tweet id');
                    err.status = 400;
                    return next(err);
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
                    tweetModel.deleteOne({ _id: tweet_id }, (err, result) => {
                        if (err) {
                            return next(err);
                        } else {
                            //delete media and send response;
                            media_array = [];
                            tweet_doc.awsMediaKeys.forEach((v) => { media_array.push({ Key: v }) });
                            if (media_array.length > 0) {
                                s3.deleteMany(media_array);
                            }

                            return res.status(200).json("Tweet has been deleted successfully");
                        }
                    })

                } else {
                    const err = new Error('Could not find the tweet.');
                    err.status = 404;
                    return next(err);
                }

            } catch (error) {
                return next(error);
            }
        }

    }

}