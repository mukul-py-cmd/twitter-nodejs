const elasticsearch = require('elasticsearch');
const tweetModel = require('../models/tweet');
const mongoose = require('mongoose');

var esClient = new elasticsearch.Client({
  host: process.env.esSearchURL,
});

const contentsearchindex = 'content_search_index';
//const creatorSearchType = 'creatorType';
const indexMapping = {
  properties: {
    message: { type: 'text' },
    author: { type: 'keyword' },
    tweetId: { type: 'keyword' },
    lastUpdated: { type: 'date' /*format: 'date'*/ },
  },
};
esClient.ping(
  {
    // ping usually has a 3000ms timeout
    requestTimeout: 1000,
  },
  function (error) {
    if (error) {
      console.log(error);
    } else {
      //getDocs();
      //searchall();
      dataCreation();
      console.log('All is well');
    }
  }
);
const temp = async function (bulkData) {
  await esClient.indices.delete({ index: contentsearchindex });
  let res = await esClient.indices.exists({
    index: contentsearchindex,
  });
  console.log(res);
  // const esResponse = await esClient.search({
  //   index: creatorSearchIndex,
  //   type: creatorSearchType,
  //   q: '_id:h4JOuXYBBqxK8dC7peB0',
  // });
  // console.log(esResponse.hits.hits);
  if (!res) {
    res = await esClient.indices
      .create({
        index: contentsearchindex,
        body: { mappings: indexMapping },
      })
      .catch((e) => {
        console.log(e);
      });
    console.log(res);
  }
  res = await esClient
    .bulk({
      body: bulkData,
      _source: false,
      refresh: 'true',
    })
    .catch((e) => {
      console.log(e);
    });
  console.log(res);
};
//temp();
const dataCreation = async function () {
  await mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  var userData = [];
  var bulkData = [];
  tweetModel.find({}, { message: 1, author: 1, updatedAt: 1 }, (err, doc) => {
    if (doc) {
      doc.forEach((element) => {
        const d = element.updatedAt;
        userData.push({
          message: element.message || '',
          author: element.author || '',
          tweetId: element._id,
          lastUpdated: element.updatedAt || '',
        });
      });
      console.log({ userData });
      userData.forEach((element) => {
        bulkData.push(
          {
            index: {
              _index: contentsearchindex,
            },
          },
          element
        );
      });
      temp(bulkData);
    }
  });
};
