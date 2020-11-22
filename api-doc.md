BASE URL:


Register user [POST]
base/auth/register/
{
    "name":"mukul agarwal",
    "username":"abc_1232",
    "email":"abc@gmail.com",
    "password":"abcd321"
}



Login user[POST]
base/auth/login/
can login with username/email both. The key must be username.
{
    "username":"abc_1232",
    "password":"abcd321"
}

response
{
    "message": "login successfull",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZmEwMWNlYzFlOTkxZGU4YmZhZjEwMzQiLCJpYXQiOjE2MDQzOTE0MDEsImV4cCI6MTYwNDQzNDYwMX0.HDdivYPrBVfN-m4OrjZLfPaFBnxVF7SBl-sL_RH_ysk"
}

Get Profile[GET]
{{host}}profile?username=mukulag321
No token needed

response
{
    "profile": {
        "bio": "Write about yourself.",
        "profilePic": "https://twitter-django-media.s3.amazonaws.com/default.jpg",
        "followers": 0,
        "following": 0
    }
}

Update Profile[PUT]
{{host}}profile/update?username=mukulag321
headers{
    "Authorization":"Token 0b26247231851c198b59fd6a5a13b5ae2ac20e61",
    "Content-Type":"multipart/form-data"
}

request
{
    "bio":"anything else",
    "image":"FILE FORMAT"
}

response
{
    "bio": "First proper account",
    "profilePic": "https://twitter-django-media.s3.amazonaws.com/default.jpg",
    "followers": 0,
    "following": 0
}

Tweet post
//For video key is videolinks. Only one video in a tweet.
//Can upload maximum of 3 images // content type is multipart/form-data
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZmEwMWNlYzFlOTkxZGU4YmZhZjEwMzQiLCJpYXQiOjE2MDU0NDk1NjksImV4cCI6MTYwNTQ5Mjc2OX0.hS48wZGip6P98HaP4jqArZbrWQaNYr_nSOYmpw_jkaI");

var formdata = new FormData();
formdata.append("message", "fIESRT");
formdata.append("author", "5fa95a12ffcf7367a2c9f18a");
formdata.append("imagelinks", fileInput.files[0], "mukul agarwal.jpg");

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: formdata,
  redirect: 'follow'
};

fetch("http://localhost:5000/tweet", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));


++++++
username unique error handle // mongoose errors.



======features
cloudwatch logger
image not contained in memory while posting
comments feature
notifications for postlikes,comment