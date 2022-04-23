const express = require('express');
const app = express();
const port = 5000;
var cors = require('cors')
const db = require('./queries');

app.use(express.json());
app.use(cors());

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' });
});


app.get('/reviews/:id/meta', db.getReviewMeta);

app.get('/reviews/:id', db.getReviewByProductId);

app.post('/reviews/report/:reviewId', db.reportReviewById);

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});