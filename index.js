// import express
import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

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
// config to allow cookie parser
app.use(cookieParser());
// ===========specify routes and their reqs/res==========

app.get('/note', (req, res) => {
  if (req.cookies.loggedIn === undefined) {
    console.log('user is not a member');
    res.status(403).send('Only members can post observations. Please or sign up to proceed.');
    return;
  }
  res.render('note');
});

app.post('/note', (req, res) => {
  console.log('request to post  came in');

  const { fDate, fBehavior, fFlockSize } = req.body;
  const sqlQuery = 'INSERT INTO notes (date, behavior, flock_size, user_id) VALUES ($1, $2, $3, $4) RETURNING *';
  const inputData = [`${fDate}`, `${fBehavior}`, `${fFlockSize}`, `${req.cookies.username}`];
  pool.query(sqlQuery, inputData, (err, result) => {
    if (err) {
      console.log(`sql query error: ${err}`);
    }
    res.redirect(`/note/${result.rows[0].id}`);
  });
});

app.get('/note/:id', (req, res) => {
  const { id } = req.params;
  // set the query
  const sqlQuery = `SELECT * FROM notes WHERE id=${Number(id)}`;
  console.log(`sql query is: ${sqlQuery}`);

  // execute the query
  pool.query(sqlQuery, (queryErr, result) => {
    if (queryErr) {
      console.log(`query error: ${queryErr}`);
      res.status(503).send('Sorry, not found!');
      return;
    }
    // console.table(result.rows[0]);
    console.log(result.rows[0]);
    res.render('note-id', result.rows[0]);
  });
});

app.get('/', (req, res) => {
  console.log('request for \'/\' came in');
  // set the sql query
  const sqlQuery = 'SELECT * FROM notes';
  // execute the query
  pool.query(sqlQuery, (queryErr, result) => {
    if (queryErr) {
      console.log(`error w/ pool.query: ${queryErr}`);
      res.status(503).send('Sorry, not found!');
      return;
    }
    console.table(result.rows);
    const tableContents = result.rows;
    res.render('home', { tableContents });
  });
});

app.get('/signUp', (req, res) => {
  res.render('signUp');
});
app.post('/signUp', (req, res) => {
  const { fUserName, fPassword } = req.body;
  console.log(fUserName);
  console.log(fPassword);

  const sqlQuery = `INSERT INTO userCredentials (email, password) VALUES ('${fUserName}', '${fPassword}') RETURNING *`;
  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log(`query error: ${err}`);
      res.status(500).send('Sorry, there was an error creating your user account');
    }
    console.log('user account created!');
    console.table(result.rows);
    res.redirect('/login');
  });
});

app.get('/login', (req, res) => {
  res.render('login');
  console.log('completed rendering get /login');
});

app.post('/login', (req, res) => {
  console.log('commencing post /login');
  const { fUserName, fPassword } = req.body;
  console.log(`fUserName is ${fUserName}`);
  console.log(`fPassword is ${fPassword}`);

  // authenticate the credentials by checking if it is in our databse
  const sqlQuery = `SELECT * FROM userCredentials WHERE email='${fUserName}'`;
  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log(`query error: ${err}`);
      res.status(503).send(result.rows);
      return;
    }
    if (result.rows.length === 0) {
      // we didn't find a user with that email
      /* the error for password and user are the same.
      don't tell the user which error they got for security reasons,
      otherwise people can guess if a person is a user of a given service. */
      res.status(403).send('sorry-1 !');
      return;
    }
    const user = result.rows[0];
    console.log(user.email);
    console.log(user.password);

    if (user.password === fPassword) {
      console.log('credentials are legit');
      res.cookie('loggedIn', true);
      // res.cookie('username', user.email);
      res.send('Login succesful!');
    } else {
      // password didn't match
      /*  the error for password and user are the same.
      don't tell the user which error they got for security reasons,
      otherwise people can guess if a person is a user of a given service.
      */
      res.status(403).send('sorry-2 !');
    }
  });
});

// app.delete('/logout', (req, res) => {
//   const { index } = req.params;
//   read('data.json', (data, err) => {
//     // identify target content to delete and splice it out of the array
//     data.sightings.splice(index, 1);
//     // write the data to the file
//     write('data.json', data, (doneData) => {
//       console.log('done!');
//       res.redirect('/');
//     });
//   });
// });

app.listen(PORT);
