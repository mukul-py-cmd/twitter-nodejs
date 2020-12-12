const mongoose = require('mongoose');
//const userAuth = require('./user');

//add two fields in author field and the use of ref when not using populate
// const childCommentSchema = mongoose.Schema(
//   {
//     commentorid: mongoose.Schema.Types.ObjectId,
//     text: String,
//     likescount: { type: Number, default: 0 },
//     threadlevel: { type: Number, default: 0, max: 1 },
//     parentid: mongoose.Schema.Types.ObjectId,
//   },
//   { timestamps: true }
// );

const commentSchema = mongoose.Schema(
  {
    commentorid: { type: mongoose.Schema.Types.ObjectId, index: true },
    text: String,
    threadlevel: { type: Number, default: 0, max: 1 },
    commentscount: { type: Number, default: 0 },
    parentid: { type: mongoose.Schema.Types.ObjectId, index: true },
  },
  { timestamps: true }
);
//commentSchema.add({ comments: [{ type: commentSchema, select: false }] });
//commentSchema.add({ comments: [childCommentSchema] });
const tweetSchema = mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
      maxlength: [400, 'Tweet length must be smaller than 400 characters.'],
    },
    imagelinks: [String],
    videolinks: String,
    likescount: { type: Number, default: 0 },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userAuth',
      index: true,
    },
    awsMediaKeys: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, index: true }],
    commentscount: { type: Number, default: 0 },
    comments: [commentSchema],
  },
  { timestamps: true }
);

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
