module.exports = function (services, config, utils) {
  return {
    authController: require('./auth')(services, config, utils),
    profileController: require('./profile')(services, config, utils),
    tweetController: require('./tweet')(services, config, utils),
    searchController: require('./search')(services, config, utils),
  };
};
