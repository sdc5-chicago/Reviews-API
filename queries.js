const Pool = require('pg').Pool
const pool = new Pool({
  user: '',
  host: 'localhost',
  database: 'sdc',
  password: '',
  port: 5432,
});

const getUserById = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query('SELECT * FROM reviews WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(JSON.stringify(results.rows));
  });
}

module.exports = {
  getUserById,
}

