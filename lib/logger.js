const bunyan = require('bunyan');
var createCWStream = require('bunyan-cloudwatch');
const config = require('../config/config');

var stdOutLog = bunyan.createLogger({
  name: 'twitter',
  level: 'debug',
  streams: [
    {
      level: 'info',
      stream: process.stdout, // log INFO and above to stdout
    },
    {
      level: 'debug',
      path: './myapp-error.log', // log ERROR and above to a file
    },
  ],
});

var stream = createCWStream({
  logGroupName: 'twitter',
  logStreamName: 'twitter-stream',
  cloudWatchLogsOptions: {
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
var awsLog = bunyan.createLogger({
  name: 'twitter',
  streams: [
    {
      level: 'info',
      type: 'raw', // use 'raw' to get raw log record objects
      stream: stream,
    },
  ],
});

// log.info('First log');
// console.log(log.levels());

/*
var log = bunyan.createLogger({
  name: 'myapp',
  streams: [
    {
      level: 'info',
      stream: process.stdout            // log INFO and above to stdout
    },
    {
      level: 'error',
      path: '/var/tmp/myapp-error.log'  // log ERROR and above to a file
    }
  ]
});

var log = bunyan.createLogger({
    name: <string>,                     // Required
    level: <level name or number>,      // Optional, see "Levels" section
    stream: <node.js stream>,           // Optional, see "Streams" section
    streams: [<bunyan streams>, ...],   // Optional, see "Streams" section
    serializers: <serializers mapping>, // Optional, see "Serializers" section
    src: <boolean>,                     // Optional, see "src" section
 
    // Any other fields are added to all log records as is.
    foo: 'bar',
    ...
});
*/

module.exports = function log(msg, level) {
  if (config.environ !== 'local') {
    console.log('yes');
    awsLog[level](msg);
  }
  if (config.environ === 'local') {
    stdOutLog[level](msg);
  }
};
