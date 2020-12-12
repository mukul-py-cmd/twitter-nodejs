var router = require('express').Router();
const upload = require('../middleware/filehandler');

var cpUpload = upload.fields([
  {
    name: 'imagelinks',
    maxCount: 3,
  },
  {
    name: 'videolinks',
    maxCount: 1,
  },
]); //add file filter to upload only images.
module.exports = function (controllers) {
  router.route('/').post(cpUpload, controllers.tweetController.post);
  router.route('/').get(controllers.tweetController.display_user_tweets);
  router.route('/alltweets').get(controllers.tweetController.display);
  router.route('/').put(controllers.tweetController.update_tweet);
  router.route('/').delete(controllers.tweetController.delete_tweet);
  router.route('/tweet-like').put(controllers.tweetController.tweet_like);
  router.route('/tweet-like').get(controllers.tweetController.get_like_list);
  router.route('/addcomment').post(controllers.tweetController.addComment);
  router.route('/editcomment').put(controllers.tweetController.editComment);
  router
    .route('/deletecomment')
    .delete(controllers.tweetController.deleteComment);
  router.route('/getcomment').get(controllers.tweetController.getComment);
  router
    .route('/get-tweet-by-id')
    .get(controllers.tweetController.getTweetById);

  return router;
};
