const router = require('express').Router();

module.exports = function (controllers) {
  router.route('/usersearch').get(controllers.searchController.userSearch);
  router
    .route('/contentsearch')
    .get(controllers.searchController.contentSearch);
  return router;
};
