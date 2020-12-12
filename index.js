const express = require('express');

const app = express();
require('dotenv/config');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var helmet = require('helmet');
var cors = require('cors');
const config = require('./config/config');
const utils = require('./lib/utils');
const services = require('./services');
const controllers = require('./controllers')(services, config, utils);
const routes = require('./routes')(controllers);
const authenticate = require('./middleware/authenticate');
const log = require('./lib/logger');
//middlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ extended: true }));
app.use(authenticate);

// app.post('/profile', function (req, res, next) {
//   // req.file is the `avatar` file
//   // req.body will hold the text fields, if there were any
//   //console.log(req.file);
//   console.log(req.body);
//   res.json("ok");
// })

app.get('/', function (req, res) {
  return res.status(200).json({ success: 'true', data: 'This was a mistake' });
});

app.use('/auth', routes.auth);
app.use('/profile', routes.profile);
app.use('/tweet', routes.tweet);

//error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  //mongoose validation error handler
  //console.log(err);

  if (err.name === 'ValidationError') {
    var error_dict = {};
    for (var key of Object.keys(err.errors)) {
      error_dict[key] = err.errors[key].message;
    }
    res.status(400).json({ status: 400, message: error_dict });
  } else {
    res
      .status(err.status || 500)
      .json({ status: err.status || 500, message: err.message });
  }
});

//******mongoose connections */
mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  () => console.log('connected to db')
);
mongoose.connection.once('open', function () {
  console.log('db is connected');
  //mongoose.connection.close();
});
mongoose.connection.once('error', function () {
  console.log('Error while connecting to mongodb');
});
mongoose.connection.on('close', () => {
  console.log('mongo connection closed');
});

// process.on('uncaughtException', function (err) {
//   jsonLogger.logError(err, {
//     type: 'UNCAUGHT_EXCEPTION',
//   });
// });

// process.on('unhandledRejection', (err) => {
//   jsonLogger.logError(err, {
//     type: 'UNCAUGHT_EXCEPTION',
//   });
// });

app.listen(5000, () => console.log('server listening'));
