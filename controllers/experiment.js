// const tweetModel = require('../models/tweet');
// const mongoose = require('mongoose');
// require('dotenv/config');

// // tweetModel.findOne((err, doc) => {
// //   console.log(doc);
// //   close();
// // });

// tweetModel.updateOne(
//   { _id:  },
//   { $set: { message: 'experiment random' } },
//   (err, doc) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(doc);
//     }
//     close()
//   }
// );

// mongoose.connect(
//   process.env.DB_CONNECTION,
//   { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
//   () => console.log('connected to db')
// );
// mongoose.connection.on('close', () => {
//   console.log('db conn closed');
//   process.exit(0);
// });
// function close() {
//   mongoose.connection.close();
//   //   process.exit(0);
// }
