const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
//https://www.npmjs.com/package/multer
//var cpUpload = upload.fields([{ name:’screenShots’, maxCount:5 },{ name:’apk’, maxCount:1 }]);
module.exports = upload;
