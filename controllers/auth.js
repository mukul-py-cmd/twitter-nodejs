const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userAuth = require('../models/user');
const authValidSchema = require('../helper/userauthvalid');
//joi
module.exports = function (services, config, utils) {
  return {
    register: async (req, res, next) => {
      try {
        const result = await authValidSchema.validateAsync(req.body);
      } catch (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      bcrypt.hash(req.body.password, 10, async (err, hashedPass) => {
        if (err) {
          return res.json({
            error: err,
          });
        }
        const { name, username, email } = req.body;
        //console.log(name)
        try {
          let user = new userAuth({
            name,
            username,
            email,
            password: hashedPass,
          });
          const userdoc = await user.save();
          return res.json(`Account registered for user ${userdoc.username}`);
        } catch (error) {
          //console.log(error);
          return next(error);
        }
      });
    },
    login: async (req, res, next) => {
      const { username, password } = req.body;
      const user = await userAuth.findOne({
        $or: [{ email: username }, { username: username }],
      });
      if (user) {
        //console.log(user);
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            console.log(err);
            return res.json({ error: err });
          }
          if (result) {
            const token = jwt.sign({ _id: user._id }, process.env.jwt_secret, {
              expiresIn: '12h',
            });
            var user_info = user.toObject();
            delete user_info.password;
            delete user_info.__v;
            return res.json({
              message: 'login successfull',
              token: token,
              user_info,
            });
          } else {
            return res.json({
              message: 'Username or password is incorrect.',
            });
          }
        });
      } else {
        return res.json({
          message: 'No account exists with this username/email. Please SignUp.',
        });
      }
    },
  };
};
