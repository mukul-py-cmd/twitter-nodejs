module.exports = {
    isOwnerPermission: (req, obj) => {
        //console.log(typeof (req.userid), typeof (obj._id))
        return new Promise((resolve, reject) => {
            if (req.userid._id == obj._id) {
                resolve();
            } else {

                const err = new Error('You must be the owner of this profile.');
                err.status = 401;
                reject(err);
            }
        })

    }
}