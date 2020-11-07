const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, index: { unique: true }, required: true },
    password: { type: String, required: true },
    profile: {
        bio: { type: String, default: 'Write about yourself.', trim: true, maxlength: [400, 'Bio length must be smaller than 400 characters.'] },
        profilePic: { type: String, default: 'https://twitter-django-media.s3.amazonaws.com/default.jpg' },
        profilePicFull: String,
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        coverPic: String
    }


}, { timestamps: true })


const userAuth = mongoose.model('userAuth', userSchema);
module.exports = userAuth;

