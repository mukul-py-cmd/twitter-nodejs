module.exports = {
  paginate: function (
    model,
    page = 1,
    limit = 10,
    projections = '',
    sortBy = { updatedAt: -1 },
    filter = {}
  ) {
    return new Promise((resolve, reject) => {
      // const page = parseInt(req.query.page)
      // const limit = parseInt(req.query.limit)
      //console.log(limit, page);
      var startIndex = Math.max((page - 1) * limit, 0);
      //const endIndex = page * limit;
      // console.log(startIndex);
      // const total_length = await model.countDocuments();
      // console.log(total_length)
      // if (startIndex >= total_length) {

      //     startIndex = (Math.ceil(total_length / limit) - 1) * limit;
      // };
      // console.log(startIndex);
      //const results = {}
      // if (endIndex < await model.countDocuments().exec()) {
      //     results.next = {
      //         page: page + 1,
      //         limit: limit
      //     }
      // }
      // if (startIndex > 0) {
      //     results.previous = {
      //         page: page - 1,
      //         limit: limit
      //     }
      // }
      model
        .find(filter)
        .select(projections)
        .limit(limit)
        .sort(sortBy)
        .skip(startIndex)
        .lean()
        .exec((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
    });
  },
  paginateNew: function (model, page = 1, options) {
    return new Promise((resolve, reject) => {
      const limit = options.limt || 10;
      const projections = options.projections || '';
      const sortBy = options.sortBy;
      const filter = options.filter || {};

      var startIndex = Math.max((page - 1) * limit, 0);
      var query = model
        .find(filter)
        .select(projections)
        .limit(limit)
        .skip(startIndex)
        .lean();
      if (sortBy) {
        query = query.sort(sortBy);
      }
      query.exec((err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  },
};
