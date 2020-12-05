module.exports = {
  isOwnerPermission: (req, obj, id_type = '_id') => {
    // console.log("id_type", id_type);
    // console.log(req.userid._id, obj[id_type], obj.author);
    return new Promise((resolve, reject) => {
      if (req.userid._id == obj[id_type]) {
        resolve();
      } else {
        const err = new Error('You must be the owner of this profile.');
        err.status = 401;
        reject(err);
      }
    });
  },
  isLoggedIn: (req) => {
    if (req.userid) {
      return true;
    } else {
      var err = new Error('please login for this feature');
      //console.log(err.message)
      err.status = 401;
      throw err;
    }
  },
};
