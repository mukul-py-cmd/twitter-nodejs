const mongoose = require('mongoose');
//const userAuth = require('./user');


//add two fields in author field and the use of ref when not using populate
const tweetSchema = mongoose.Schema({
    message: { type: String, trim: true, maxlength: [400, 'Tweet length must be smaller than 400 characters.'] },
    imagelinks: [String],
    videolinks: String,
    likes: { type: Number, default: 0 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'userAuth', index: true },
    awsMediaKeys: [String]
}, { timestamps: true });

tweetSchema.index('updatedAt');
//console.log(tweetSchema.indexes()); lists all indexes on schema
/*
tweetSchema.methods.toJSON = function() {
 var obj = this.toObject();
 delete obj.awsMediaKey;
 return obj;
}
*/
const tweetModel = mongoose.model('tweetModel', tweetSchema);
module.exports = tweetModel;