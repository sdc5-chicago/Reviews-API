var Promise = require("bluebird");
const Pool = require('pg').Pool

const pool = new Pool({
  user: '',
  host: 'localhost',
  database: 'sdc',
  password: '',
  port: 5432,
});

const postByUserId = (request, response) => {

}

const getUserById = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query('SELECT * FROM reviews WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(JSON.stringify(results.rows));
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

      resolve(results.rows);
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
      console.log('resultObj', resultObj);

    });
  })

  return myPromise;
}

const getReviewMeta = (request, response) => {
  const id = parseInt(request.params.id); //product_id

  let resultObj = {'product_id': id, 'ratings': {}, 'recommended': {}, 'characteristics': {} };
  buildMeta(resultObj, id)
    .then((result) => {
      console.log('here');
      // console.log(result);
      // resultObj = result;
    });

}

module.exports = {
  getUserById,
  getReviewMeta,
  postByUserId,
}

