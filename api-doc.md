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