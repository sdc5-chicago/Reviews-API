var Promise = require("bluebird");
const Pool = require('pg').Pool

const pool = new Pool({
  user: '',
  host: 'localhost',
  database: 'sdc',
  password: '',
  port: 5432,
});


const getReviewByProductId = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query(
    `SELECT rv.id AS review_id, rating, summary, recommend, response, body, date, reviewer_name, helpfulness,
      jsonb_agg(jsonb_build_object(rp.id, rp.url)) AS photos
      FROM reviews AS rv
      INNER JOIN review_photos AS rp ON rp.review_id = rv.id
      WHERE rv.product_id = $1
      GROUP BY rv.id;`, [id], (error, results) => {
    if (error) {
      throw error
    }
    let obj = {'product_id': id}

    results.rows.forEach((row) => {
      row['date'] = new Date(Number(row['date']));
    })

    obj['results'] = results.rows;
    console.log(obj)
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
        reject(error);
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

const reportReviewById = (request, response) => {
  const reviewId = parseInt(request.params.reviewId); //product_id

  pool.query(
    `UPDATE reviews SET reported = true WHERE id = $1;`, [reviewId], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(JSON.stringify(results));
  });
}

const addPhotos = (url) => {
  const myPromise = new Promise((resolve, reject) => {pool.query(`INSERT INTO review_photos (review_id, url) VALUES ((SELECT max(id) FROM reviews), $1);`,
  [url], (error, results) => {
    if (error) {
      reject(error);
    }
    resolve(results);
  })});
}

const addCharacteristics = (characteristic_id, value) => {
  const myPromise = new Promise((resolve, reject) => {pool.query(`INSERT INTO characteristic_reviews (characteristic_id, review_id, value) VALUES ($1, (SELECT max(id) FROM reviews), $2);`,
  [characteristic_id, value], (error, results) => {
    if (error) {
      reject(error);
    }
    resolve(results);
  })});
}

const postReviewById = (request, response) => {
  const id = parseInt(request.params.id);
  let values = {'product_id': id, ...request.body}
  values['date'] = new Date;

  const {
    product_id,
    rating,
    summary,
    body,
    recommend,
    name,
    email,
    photos,
    characteristics,
  } = values;

  let promises = [];

  const myPromise = new Promise((resolve, reject) => {pool.query(
    `INSERT INTO reviews (product_id, rating, summary, body, recommend, reviewer_name, reviewer_email) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
    [ product_id,
      rating,
      summary,
      body,
      recommend,
      name,
      email,], (error, results) => {
    if (error) {
      throw error
      reject(error);
    }
    resolve(results);
    response.status(200).send(JSON.stringify(results));
  })});

  promises.push(myPromise);

  if (photos.length !== 0) {
    photos.forEach((url) => {
      promises.push(addPhotos(url));
    });
  }

  if (Object.keys(characteristics).length !== 0) {
    for (let prop in characteristics) {
      promises.push(addCharacteristics(prop, characteristics[prop]));
    }
  }

  Promise.all(promises)
    .then((result) => {
      console.log('worked');
    });

}

module.exports = {
  getReviewByProductId,
  getReviewMeta,
  reportReviewById,
  postReviewById,
}

