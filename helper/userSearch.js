const elasticsearch = require('elasticsearch');
// const userAuth = require('./user');
const mongoose = require('mongoose');
//const { query } = require('express');
// 'http://10.0.2.91:9200'
//mukulagarwal FJ6yXgiZw7SQ92159qkmLmGt@ arn:aws:es:ap-south-1:497303418550:domain/twitter-backend-es/*
var esClient = new elasticsearch.Client({
  host:
    'https://mukulagarwal:FJ6yXgiZw7SQ92159qkmLmGt@@search-twitter-backend-es-tp4aqisowezypxfpzmyarfyt34.ap-south-1.es.amazonaws.com/',
  // 'https://elastic:FJ6yXgiZw7SQ92159qkmLmGt@0793eb8147c4490ab400fc6f0c61c38c.ap-south-1.aws.elastic-cloud.com:9243',
});

const userprofileindex = 'user_profile_index';
//const creatorSearchType = 'creatorType';
const indexMapping = {
  properties: {
    name: { type: 'text' }, // publisher.name
    userName: {
      type: 'text',
      fields: {
        raw: {
          type: 'keyword',
        },
      },
    }, // publisher.meta.displayName
    profilePic: { type: 'keyword' }, // publisher.marketplaceDescription
    email: { type: 'keyword' },
    bio: { type: 'text' },
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
      // getDocs();
      //searchall();
      //   dataCreation();
      console.log('All is well');
    }
  }
);
const temp = async function (bulkData) {
  await esClient.indices.delete({ index: userprofileindex });
  let res = await esClient.indices.exists({
    index: userprofileindex,
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
        index: userprofileindex,
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
  await mongoose.connect(
    'mongodb+srv://mukul81996:XPW4e0giOd5eNBNk@mongo-exp.ar2xh.mongodb.net/mongo-exp?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
  );
  var userData = [];
  var bulkData = [];
  mongoose.model('userAuth').find({}, (err, doc) => {
    if (doc) {
      doc.forEach((element) => {
        userData.push({
          name: element.name || '',
          userName: element.username || '',
          profilePic: (element.profile && element.profile.profilePic) || '',
          email: element.email || '',
          bio: (element.profile && element.profile.bio) || '',
        });
      });
      userData.forEach((element) => {
        bulkData.push(
          {
            index: {
              _index: userprofileindex,
            },
          },
          element
        );
      });
      temp(bulkData);
    }
  });
};
//dataCreation();
const getDocs = async function () {
  const esResponse = await esClient.search({
    index: userprofileindex,
    //q: `name:rishabh`,
    body: {
      query: {
        match_all: {
          //userName: 'risgpta',
        },
      },
    },

    // _source: ['name', 'email'],
  });
  if (esResponse.hits.total.value > 0) {
    console.log(JSON.stringify(esResponse.hits.hits));
  }
};

const searchall = async function () {
  // const res = await esClient.search({
  //   index: userprofileindex,
  //   body: { query: { match_all: {} } },
  // });
  // console.log(res.hits.hits);
  const res = await esClient.search({
    index: userprofileindex,
    body: {
      from: 0,
      size: 1,
      query: { match: { name: 'rishabh ' } },
      sort: [{ profilePic: 'asc' }, { tie_breaker_id: 'asc' }],
      // search_after: [
      //   'https://twitter-django-media.s3.amazonaws.com/default.jpg',
      // ],
    },
  });
  console.log(res.hits.hits);
};

async function findAndUpdate(doc) {
  const esResponse = await esClient.search({
    index: userprofileindex,
    q: `userName:${doc.username}`,
    // _source: ['name', 'email'],
    _source: false,
  });
  if (esResponse.hits.total.value === 1) {
    const mappedDoc = mapDoc(doc);
    esClient.index({
      index: userprofileindex,
      id: esResponse.hits.hits[0]._id,
      body: mappedDoc,
      refresh: true,
    });
  }
}
async function indexNewUser(doc) {
  const mappedDoc = mapDoc(doc);
  esClient.index({
    index: userprofileindex,
    body: mappedDoc,
    refresh: true,
  });
}
function mapDoc(doc) {
  return {
    name: doc.name || '',
    userName: doc.username,
    profilePic: doc.profile.profilePic,
    email: doc.email,
    bio: doc.profile.bio,
  };
}
exports.findAndUpdate = findAndUpdate;
exports.indexNewUser = indexNewUser;
