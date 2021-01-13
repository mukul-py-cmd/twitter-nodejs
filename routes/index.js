module.exports = function (controllers) {
  return {
    auth: require('./auth')(controllers),
    profile: require('./profile')(controllers),
    tweet: require('./tweet')(controllers),
    esSearch: require('./search')(controllers),
  };
};
