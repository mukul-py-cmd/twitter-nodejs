const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    var decode;
    if (req.headers.authorization) {
      //console.log(req.headers.authorization)
      const token = req.headers.authorization.split(' ')[1];
      decode = jwt.verify(token, process.env.jwt_secret);
    }
    req.userid = decode;
    next();
  } catch (error) {
    const err = new Error('Authentication failed.');
    err.status = 300;
    next(err);
  }
};

module.exports = authenticate;
