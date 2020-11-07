var router = require('express').Router();
const upload = require('../middleware/filehandler');

//const path = require('path');
module.exports = function (controllers) {
    router
        .route('/update')
        .put(upload.single('profilePic'), controllers.profileController.update);
    router
        .route('/')
        .get(controllers.profileController.get);
    return router;
};