// import express
import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';

// Initialise the DB connection
const { Pool } = pg;
// config the connection
const pgConnectionConfig = {
  name: 'jeremylim',
  host: 'localhost',
  database: 'birding',
  port: 5432,
};
const pool = new Pool(pgConnectionConfig);

// initialise express
const app = express();
const PORT = 3004;

// =========middleware configs===================
app.set('view engine', 'ejs');
// config to allow use of external CSS stylesheets
app.use(express.static('public'));
// config to accept request form data
app.use(express.urlencoded({ extended: false }));
// config to allow use of method override with POST having ?_method=PUT
app.use(methodOverride('_method'));

// ===========specify routes and their reqs/res==========

app.get('/note', (req, res) => {
  res.render('note');
});

app.post('/note', (req, res) => {
  console.log('request for /note came in');
  console.log('req.body is: ');
  console.log(req.body);
  const { fDate, fBehavior, fFlockSize } = req.body;
  const sqlQuery = 'INSERT INTO notes (date, behavior, flock_size) VALUES ($1, $2, $3)';
  const inputData = [`${fDate}`, `${fBehavior}`, `${fFlockSize}`];
  pool.query(sqlQuery, inputData, () => {
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  console.log('request for \'/\' came in');
  // set the sql query
  const sqlQuery = 'SELECT * FROM notes';
  // execute the query
  pool.query(sqlQuery, (queryErr, result) => {
    if (queryErr) {
      console.log(`error w/ pool.query: ${err}`);
      res.status(503).send('Sorry, not found!');
      return;
    }
    console.table(result.rows);
    res.send(result.rows);
  });
});

app.get('/note/:id', (req, res) => {
  const { id } = req.params;
  // set the query
  const sqlQuery = `SELECT * FROM notes WHERE id=${id}`;
  console.log(`sql query is: ${sqlQuery}`);

  // execute the query
  pool.query(sqlQuery, (queryErr, result) => {
    if (queryErr) {
      console.log(`query error: ${queryErr}`);
      res.status(503).send('Sorry, not found!');
      return;
    }
    // res.render('note-id', { result });
    console.table(result.rows[0]);
    console.log(result.rows[0]);
    res.render('note-id', result.rows[0]);
  });
});

app.listen(PORT);
