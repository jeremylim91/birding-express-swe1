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
// Route description: Add a note/sighting
app.get('/note', (req, res) => {
  if ((req.cookies.loggedIn === undefined) || (req.cookies.username === undefined)) {
    console.log('user is not a member');
    res.status(403).render('sorry');
    return;
  }
  // get species from the species table to display the  dropdown
  const sqlQuery = 'SELECT * FROM species';
  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log(`error: ${err}`);
      return;
    }
    const data = { species: result.rows };
    // get data from the behavior column to display via checkboxes
    const behaviorQuery = 'SELECT * FROM behaviors_table';
    pool.query(behaviorQuery, (behaviorQueryErr, behaviorQueryResult) => {
      if (behaviorQueryErr) {
        console.log(`Error: ${behaviorQueryErr}`);
      }
      const behaviorsToDisplay = behaviorQueryResult.rows;
      console.log('  behaviors to display is :');
      console.log(behaviorsToDisplay);

      data.behaviors = behaviorsToDisplay;

      console.log('data is:');
      console.log(data);
      res.render('note', data);
    });
  });
});

app.post('/note', (req, res) => {
  console.log('request to post  came in');
  // get params from the ejs form checkboxes on behavior
  let behaviors = req.body.behavior_ids;
  /* if there only 1 checkbox was ticked, the values is not stored in an array;
  Proceed to store the value it in an array. */
  if (Array.isArray(behaviors) === false) {
    console.log('not an array');
    behaviors = [behaviors];
  }
  // get params from the dropdown list on species
  const {
    fDate, fFlockSize, fSpeciesId,
  } = req.body;

  /* create an sql query that obtains the id from userCredentials,
  then update this FK in notes; */
  console.log('req.cookies.username is:');
  console.log(req.cookies.username);
  const queryUserIdBasedOnCookie = `SELECT * FROM userCredentials WHERE email='${req.cookies.username}'`;

  // execute query to get the user's id from userCredentials;
  pool.query(queryUserIdBasedOnCookie, (userCredQueryErr, userCredQueryResult) => {
    if (userCredQueryErr) {
      console.log(`query err: ${userCredQueryResult.rows[0].id}`);
    }
    // user's id according to userCredentials is:
    console.log('userCredentials.Id to be to be inserted into the notes table is:');
    console.log(userCredQueryResult.rows[0]);

    /* set a sql query that gets bird-watching details submitted by the ejs form     */
    const insertValuesIntoNotes = 'INSERT INTO notes (date, flock_size, user_id, species_id) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const inputData = [`${fDate}`, `${fFlockSize}`, `${userCredQueryResult.rows[0].id}`, `${fSpeciesId}`];

    // execute the sql query
    pool.query(insertValuesIntoNotes, inputData, (inserQueryIntoNotesErr, result) => {
      if (inserQueryIntoNotesErr) {
        console.log(`sql query error: ${inserQueryIntoNotesErr}`);
        return;
      }
      console.log('behaviors is: ');
      console.log(behaviors);
      // create a new row for each time a notes.id has a unique notes_behaviors_table id.
      behaviors.forEach((element) => {
        const insertBehaviorIds = `INSERT INTO notes_behaviors_table (note_id, behavior_id) VALUES(${result.rows[0].id}, ${element}) RETURNING *`;
        pool.query(insertBehaviorIds, (insertQueryErr, insertQueryResult) => {
          if (insertQueryErr) {
            console.log(`query error: ${insertQueryErr}`);
            return;
          }
          console.table(insertQueryResult.rows);
          console.log('successfully added');
        });
      });
      console.log('redirecting page now');
      res.redirect(`/note/${result.rows[0].id}`);
    });
  });
});

// Route description: display a specific note
app.get('/note/:id', (req, res) => {
  console.log('received request to get /note/:id');
  const { id } = req.params;
  // set a query to get info from notes and note_behaviors_table
  // const sqlQuery = `SELECT * FROM notes WHERE id=${Number(id)}`;
  // console.log(`sql query is: ${sqlQuery}`);

  console.log('id is: ');
  console.log(id);

  // const sqlQuery = `SELECT * FROM notes INNER JOIN notes_behaviors_table on notes.id=notes_behaviors_table.note_id WHERE notes.id=${id}`;
  const sqlQuery = `SELECT * FROM notes_behaviors_table INNER JOIN notes ON notes.id=notes_behaviors_table.note_id WHERE notes.id=${id}`;
  console.log('sqlQuery is:');
  console.log(sqlQuery);

  // execute the query
  pool.query(sqlQuery, (queryErr, result) => {
    console.log('started querying');
    if (queryErr) {
      console.log(`query error: ${queryErr}`);
      return;
    }
    console.log('result.rows for inner join is:');
    console.table(result.rows);

    // set a variable that succintly captures result.rows[0];
    const data = { notesData: result.rows };
    console.log('data-1: is');
    console.log(data);

    data.listOfBehaviors = [];
    data.notesData.forEach((element) => {
    // get the behaviors' names;
      const getBehaviorNames = `SELECT * FROM behaviors_table WHERE id=${element.behavior_id}`;
      pool.query(getBehaviorNames, (getBehaviorNamesErr, getBehaviorNamesResult) => {
        if (getBehaviorNamesErr) {
          console.log(`query error: ${getBehaviorNamesResult}`);
        }
        data.listOfBehaviors.push(getBehaviorNamesResult.rows[0]);
        console.log('data.listOfBehaviors is:');
        console.log(data.listOfBehaviors);

        // display comments
        const queryForComments = `SELECT comments FROM notes_userCredentials_table WHERE notes_id=${id}`;
        // execute the query
        pool.query(queryForComments, (queryForCommentsErr, queryForCommentsResult) => {
          if (queryForCommentsErr) {
            console.log(`Query ereror: ${queryForComments}`);
            return;
          }
          console.log('queryForCommentsResult is:');
          console.log(queryForCommentsResult.rows);
          if (queryForCommentsResult.rows.length === 0) {
            data.commentsData = [{ comments: 'No comments found' }];
          } else {
            data.commentsData = queryForCommentsResult.rows;
          }
          console.log('final \'data\' to add into ejs data is:');
          console.log(data);
          res.render('note-id', data);
        });
      });
    });
  });
});

// Route description: Display home page
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

// delete recordings on main page and database
app.delete('/:index/delete', (req, res) => {
  const { index } = req.params;
  console.log(`index is: ${index}`);
  const sqlQuery = `DELETE FROM notes WHERE id=${index}`;
  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log(`query err: ${err}`);
    }
    console.table(result.rows);
    res.redirect('/');
  });
});

// Route description: register user signup
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

// Route description: User login/logout
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
      res.cookie('username', user.email);
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
app.get('/logout', (req, res) => {
  res.clearCookie('loggedIn');
  res.clearCookie('username');
  res.redirect('/');
});

// Route description: Display list of behaviors
app.get('/behaviors', (req, res) => {
  const sqlQuery = 'SELECT * FROM behaviors_table';
  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log(`query error: ${err}`);
      return;
    }
    const data = { behaviorDescription: result.rows };
    console.log('data is: ');
    console.log(data);
    // res.render('behaviors', data);
  });
});

// Route description: Display notes with a specified  behavior
app.get('/behaviors/:index', (req, res) => {
  const { index } = req.params;
  const sqlQuery = `SELECT * FROM notes_behaviors_table WHERE behavior_id= ${index}`;

  pool.query(sqlQuery, (err, result) => {
    if (err) {
      console.log(`query error: ${result}`);
      return;
    }
    const behaviorId = result.rows;
    console.log('behavior id is :');
    console.log(behaviorId);
    let behaviorIndexData = [];
    // initialise a counter that will be used to trigger the rendering
    let counter = 0;
    // loop thru the notes table to capture each row where the id matches result.rows (prev query)
    behaviorId.forEach((element) => {
      /* this should have been an inner join (with a where statement,
      to allow the behavior to be shown on the ejs */
      const notesQuery = `SELECT * FROM notes where id=${element.note_id}`;
      pool.query(notesQuery, (queryErr, queryResult) => {
        if (queryErr) {
          console.log(`query error: ${queryErr}`);
        }
        const notesQueryResults = queryResult.rows[0];
        behaviorIndexData = [...behaviorIndexData, notesQueryResults];
        console.log(behaviorIndexData);
        counter += 1;
        console.log(`counter is: ${counter}`);

        if (counter === behaviorId.length) {
          console.log('about to render...');
          res.render('behaviors-index', { obj: behaviorIndexData });
        }
      });
    });
  });
});

// Route description: Allow a logged-in user to create a new species
app.get('/species', (req, res) => {
  if (req.cookies.loggedIn === undefined) {
    console.log('user is not a member');
    res.status(403).send('Sorry, only members can update the site. Plesae sign up or login to proceed');
  }
  res.render('species');
});
app.post('/species', (req, res) => {
  const { fSpeciesName, fScientificName } = req.body;
  const insertNewSpeciesData = `INSERT INTO species (name, scientific_name) VALUES ('${fSpeciesName}', '${fScientificName}') RETURNING *`;
  pool.query(insertNewSpeciesData, (insertNewSpeciesDataErr, insertNewSpeciesDataResult) => {
    if (insertNewSpeciesDataErr) {
      console.log(`Query Error: ${insertNewSpeciesDataErr}`);
      return;
    }
    console.log('successfully added:');
    console.table(insertNewSpeciesDataResult.rows[0]);
    res.redirect('/');
  });
});

app.post('/note/:id/comment', (req, res) => {
  if ((req.cookies.loggedIn === undefined) || (req.cookies.username === undefined)) {
    console.log('user is not a member');
    // res.status(403).send('Only members can post observations. Please or sign up to proceed.');
    res.status(403).render('sorry');
    return;
  }
  console.log('post request note/:id/comment came in');
  // get the comment content from the form
  const { fComment } = req.body;
  const { id } = req.params;
  console.log('id is:');
  console.log(id);

  // use user's cookies to query database for his id
  const nameOfCurrentUser = req.cookies.username;
  const queryForUserId = `SELECT id FROM userCredentials WHERE email='${nameOfCurrentUser}'`;
  // execute the query
  pool.query(queryForUserId, (queryForUserIdErr, queryForUserIdResult) => {
    if (queryForUserIdErr) {
      console.log(`Query Error: ${queryForUserIdResult}`);
    }
    const userId = queryForUserIdResult.rows[0].id;

    console.log('userId is: ');
    console.log(userId);

    // set sqlQuery to insert comment into comments db
    const insertComments = `INSERT INTO notes_userCredentials_table (notes_id, userCredentials_id,comments) VALUES (${id}, ${userId},'${fComment}')`;
    console.log('insert comments is:');
    console.log(insertComments);

    pool.query(insertComments, (insertCommentsErr, insertCommentsResult) => {
      if (insertCommentsErr) {
        console.log(`Query Error: ${insertCommentsResult}`);
      }
      // console.table(insertCommentsResult.rows[0]);
      res.redirect(`/note/${id}`);
    });
  });
});
app.listen(PORT);
