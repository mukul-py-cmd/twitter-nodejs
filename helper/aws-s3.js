const AWS = require('aws-sdk');
const { resolve } = require('path');
const routes = require('../routes');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    apiVersion: '2006-03-01'
})

module.exports = {
    upload: function (key, body) {
        var uploadParams = { Bucket: process.env.AWS_STORAGE_BUCKET_NAME, Key: '', Body: '' };
        uploadParams.Body = body;
        uploadParams.Key = key;

        // call S3 to retrieve upload file to specified bucket
        return new Promise((resolve, reject) => {
            s3.upload(uploadParams, function (err, data) {
                if (err) {
                    reject(err);
                } if (data) {
                    resolve(data.Location);
                }
            });
        })

    },
    /*[
        {Key: 'a.txt'},
        {Key: 'b.txt'}, == key_array format
        {Key: 'c.txt'}
    ]*/
    deleteMany: function(key_array){
        var deleteParam = {
            Bucket: process.env.AWS_STORAGE_BUCKET_NAME,
            Delete: {
                Objects: key_array
            }
        };    
        s3.deleteObjects(deleteParam, function(err, data) {
            // if (err) console.log(err, err.stack);
            // else console.log('delete', data);
        });
    }
}