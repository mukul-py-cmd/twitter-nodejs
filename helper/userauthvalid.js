const Joi = require('joi');

const schema = Joi.object({
  username: Joi.string().min(3).max(30).required(),

  password: Joi.string().required(),
  name: Joi.string().required(),

  email: Joi.string().email(),
});

module.exports = schema;
