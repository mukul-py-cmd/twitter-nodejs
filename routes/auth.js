var router = require('express').Router();
module.exports = function (controllers) {
    router
        .route('/register')
        .post(controllers.authController.register);
    router
        .route('/login')
        .post(controllers.authController.login);
    return router;
};