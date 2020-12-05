const path = require('path');
const userAuth = require('../models/user');
const s3 = require('../helper/aws-s3');
//permissions,pp and cover upload and update
module.exports = function (services, config, utils) {
  return {
    update: async (req, res, next) => {
      try {
        var userDoc = await userAuth.findOne({ username: req.query.username });
        //console.log("ddd",req.userid);
        if (userDoc) {
          //check owner permission;
          //utils.isOwnerPermission(req, userDoc).catch((err)=>{return next(err)});
          try {
            await utils.isOwnerPermission(req, userDoc);
          } catch (error) {
            return next(error);
          }
          //await utils.isOwnerPermission(req, userDoc,next);

          const { bio } = req.body;
          //console.log(bio)
          var docChanged = false;
          if (req.file) {
            const fileName = `profilepic/${userDoc.username}/${path.basename(
              req.file.originalname
            )}`;
            const profilePicUrl = await s3.upload(fileName, req.file.buffer);
            // profilePicUrl.then(data=>console.log("fileup",data))
            // .catch(err=>console.log(err));
            userDoc.profile.profilePic = profilePicUrl;
            docChanged = true;
          }
          if (bio || (bio && bio.length === 0)) {
            userDoc.profile.bio = bio;
            docChanged = true;
          }
          if (docChanged) {
            userDoc = await userDoc.save();
          }
          res.json(userDoc.profile);
        } else {
          const err = new Error('User not found');
          err.status = 400;
          next(err);
        }
      } catch (error) {
        next(error);
      }
    },
    get: async (req, res, next) => {
      try {
        //console.log("yes")
        const userDoc = await userAuth.findOne(
          { username: req.query.username },
          'profile'
        );
        //console.log(userDoc);
        if (userDoc) {
          res.json(userDoc);
        } else {
          const err = new Error('User not found');
          err.status = 400;
          next(err);
        }
      } catch (error) {
        //console.log(error)
        next(error);
      }
    },
  };
};
