var Promise = require("bluebird");
const Pool = require('pg').Pool

const pool = new Pool({
  user: '',
  host: 'localhost',
  database: 'sdc',
  password: '',
  port: 5432,
});


const getReviewById = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query(
    `SELECT rv.id AS review_id, rating, summary, recommend, response, body, date, reviewer_name, helpfulness,
      jsonb_agg(jsonb_build_object(rp.id, rp.url))
      FROM reviews AS rv
      INNER JOIN review_photos AS rp ON rp.review_id = rv.id
      WHERE rv.product_id = $1
      GROUP BY rv.id;`, [id], (error, results) => {
    if (error) {
      throw error
    }
    let obj = {'product_id': id}
    obj['results'] = results.rows;
    console.log(obj);
    response.status(200).send(JSON.stringify(obj));
  });
}

const buildRating = (id) => {

}

const buildMeta = (resultObj, id) =>  {
  const myPromise = new Promise((resolve, reject) => {
    pool.query(
    `SELECT ch.product_id, reviews.rating, COUNT(reviews.rating) AS ratings, COUNT(recommend) AS recommended, ch.name, chr.characteristic_id AS id, chr.value
    FROM characteristics AS ch
    INNER JOIN reviews ON reviews.product_id = ch.product_id
    INNER JOIN characteristic_reviews AS chr ON ch.id = chr.characteristic_id
    WHERE ch.product_id = $1
    GROUP BY ch.product_id, chr.characteristic_id, ch.name, chr.value, reviews.rating, chr.review_id;`, [id], (error, results) => {
      if (error) {
        throw error
      }

      let characteristics = {};
      results.rows.forEach((row) => {
        resultObj['ratings'][row['rating']] = parseInt(row.ratings);

        if (resultObj['recommended'][row['recommended']]) {
          resultObj['recommended'][row['recommended']]++;
        } else {
          resultObj['recommended'][row['recommended']] = 1;
        }

        if (characteristics[row['name']]) {
          characteristics[row['name']]['value'].push(row['value']);
        }

        characteristics[row['name']] = {
          'id' : row['id'],
          'value': [row['value']],
        }

      });

      for (let prop in characteristics) {
        characteristics[prop].value = characteristics[prop].value.reduce((a, b) => a + b)/characteristics[prop].value.length
      }

      resultObj.characteristics = characteristics;
      resolve(resultObj);

    });
  })

  return myPromise;
}

const getReviewMeta = (request, response) => {
  const id = parseInt(request.params.id); //product_id

  let resultObj = {'product_id': id, 'ratings': {}, 'recommended': {}, 'characteristics': {} };
  buildMeta(resultObj, id)
    .then((result) => {
      response.status(200).send(JSON.stringify(result))
    });
}

module.exports = {
  getReviewById,
  getReviewMeta,
}

